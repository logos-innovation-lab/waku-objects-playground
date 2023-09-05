import { profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import {
	chats,
	type DraftChat,
	type Chat,
	type Message,
	isGroupChatId,
	type DataMessage,
	getLastMessageTime,
	getLastSeenMessageTime,
	type ChatData,
} from '$lib/stores/chat'
import type { User } from '$lib/types'
import { PageDirection, type LightNode, type TimeFilter } from '@waku/interfaces'
import { connectWaku, sendMessage } from './waku'
import type { BaseWallet, Wallet } from 'ethers'
import { get } from 'svelte/store'
import { objectStore, objectKey } from '$lib/stores/objects'
import { lookup } from '$lib/objects/lookup'
import type { Token } from '$lib/stores/balances'
import { defaultBlockchainNetwork, sendTransaction } from '$lib/adapters/transaction'
import type { JSONSerializable, WakuObjectAdapter } from '$lib/objects'
import { makeWakuObjectAdapter } from '$lib/objects/adapter'
import { fetchBalances } from '$lib/adapters/balance'
import { makeWakustore } from './wakustore'
import type { StorageChat, StorageChatEntry, StorageObjectEntry, StorageProfile } from './types'
import { genRandomHex } from '$lib/utils'

interface QueuedMessage {
	message: Message
	address: string
	id: string
	adapter: WakuObjectAdapter
}

function createPrivateChat(chatId: string, user: User, ownAddress: string): string {
	const ownProfile = get(profile)
	const ownUser = {
		name: ownProfile.name,
		avatar: ownProfile.avatar,
		address: ownAddress,
	}
	const chat = {
		chatId,
		messages: [],
		users: [user, ownUser],
		name: user.name ?? user.address,
		unread: 0,
	}
	chats.createChat(chat)

	return chatId
}

function createGroupChat(
	chatId: string,
	users: User[],
	name: string | undefined = undefined,
	avatar: string | undefined = undefined,
	joined: boolean | undefined = undefined,
	inviter: string | undefined = undefined,
): string {
	const groupChat = {
		chatId,
		messages: [],
		users,
		name,
		avatar,
		unread: 0,
		joined,
		inviter,
	}
	chats.createChat(groupChat)

	return chatId
}

async function addMessageToChat(
	address: string,
	adapter: WakuObjectAdapter,
	chatId: string,
	message: Message,
) {
	if (message.type === 'data') {
		await executeOnDataMessage(address, adapter, message)
	}

	const unread = message.fromAddress !== address && message.type === 'user' ? 1 : 0
	chats.updateChat(chatId, (chat) => ({
		...chat,
		messages: [...chat.messages, message],
		unread: chat.unread + unread,
	}))
}

async function executeOnDataMessage(
	address: string,
	adapter: WakuObjectAdapter,
	chatMessage: DataMessage,
) {
	const descriptor = lookup(chatMessage.objectId)
	const key = objectKey(chatMessage.objectId, chatMessage.instanceId)
	const wakuObjectStore = get(objectStore)

	if (descriptor && descriptor.onMessage && wakuObjectStore.lastUpdated < chatMessage.timestamp) {
		const objects = wakuObjectStore.objects
		const updateStore = (updater: (_store: JSONSerializable) => JSONSerializable) => {
			const store = objects.get(key)
			const newStore = updater(store)
			const newObjects = new Map(objects)
			newObjects.set(key, newStore)
			objectStore.update((state) => ({
				...state,
				objects: newObjects,
				lastUpdated: chatMessage.timestamp,
			}))
		}
		const store = objects.get(key)
		await descriptor.onMessage(address, adapter, store, updateStore, chatMessage)
	}
}

export default class WakuAdapter implements Adapter {
	private waku: LightNode | undefined
	private subscriptions: Array<() => void> = []
	private numWaitingSaveChats = 0
	private isSavingChats = false
	private queuedMessages: QueuedMessage[] = []
	private isHandlingMessage = false

	async onLogIn(wallet: BaseWallet): Promise<void> {
		const address = wallet.address
		this.waku = await connectWaku()

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		const ws = makeWakustore(this.waku)

		const storageProfile = await ws.getDoc<StorageProfile>('profile', address)
		profile.update((state) => ({ ...state, ...storageProfile, address, loading: false }))

		const storageChatEntries = await ws.getDoc<StorageChatEntry[]>('chats', address)
		chats.update((state) => ({ ...state, chats: new Map(storageChatEntries), loading: false }))

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const adapter = this
		const allChats = Array.from(get(chats).chats)

		// private chats
		const privateChats = allChats.filter(([id]) => !isGroupChatId(id)).map(([, chat]) => chat)

		const lastSeenMessageTime = getLastSeenMessageTime(privateChats)
		const now = new Date()
		const timeFilter = {
			startTime: new Date(lastSeenMessageTime + 1),
			endTime: now,
		}
		await this.subscribeToPrivateMessages(address, address, wakuObjectAdapter, timeFilter)

		// group chats
		const groupChatIds = allChats.filter(([id]) => isGroupChatId(id)).map(([id]) => id)

		for (const groupChatId of groupChatIds) {
			await this.subscribeToGroupChat(groupChatId, address, wakuObjectAdapter)
		}

		// chat store
		const subscribeChatStore = chats.subscribe(async () => {
			if (this.isSavingChats) {
				this.numWaitingSaveChats++
				return
			}

			this.isSavingChats = true

			do {
				this.numWaitingSaveChats = 0
				await this.saveChatStore(address)
			} while (this.numWaitingSaveChats > 0)

			this.isSavingChats = false
		})
		this.subscriptions.push(subscribeChatStore)

		// object store
		const storageObjects = await ws.getDoc<StorageObjectEntry[]>('objects', address)
		objectStore.update((state) => ({
			...state,
			objects: new Map(storageObjects),
			lastUpdated: Date.now(),
			loading: false,
		}))

		const subscribeObjectStore = objectStore.subscribe(async (objects) => {
			if (!adapter.waku) {
				return
			}
			await ws.setDoc<StorageObjectEntry[]>('objects', address, Array.from(objects.objects))
		})
		this.subscriptions.push(subscribeObjectStore)

		// deferred updates
		fetchBalances(address)
		this.updateContactProfiles()
	}

	async onLogOut() {
		this.subscriptions.forEach((s) => s())
		this.subscriptions = []
		profile.set({ loading: false })
	}

	async saveUserProfile(address: string, name?: string, avatar?: string): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const defaultProfile: StorageProfile = { name: name ?? address }
		const storageProfile = (await this.fetchStorageProfile(address)) || defaultProfile

		if (avatar) storageProfile.avatar = avatar
		if (name) storageProfile.name = name

		if (avatar || name) {
			const ws = makeWakustore(this.waku)
			ws.setDoc<StorageProfile>('profile', address, storageProfile)
			profile.update((state) => ({ ...state, address, name, avatar }))
		}
	}

	async getUserProfile(address: string): Promise<User | undefined> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}
		return this.storageProfileToUser(address)
	}

	async startChat(address: string, peerAddress: string): Promise<string> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const chatId = peerAddress
		const user = await this.storageProfileToUser(chatId)
		if (!user) {
			throw 'invalid user'
		}

		createPrivateChat(chatId, user, address)

		return chatId
	}

	async startGroupChat(wallet: BaseWallet, chat: DraftChat): Promise<string> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}
		if (chat.users.length === 0) {
			throw 'invalid chat'
		}

		const chatId = genRandomHex(64)

		const userPromises = chat.users.map((address) => this.storageProfileToUser(address))
		const allUsers = await Promise.all(userPromises)
		const users = allUsers.filter((user) => user) as User[]

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		createGroupChat(chatId, users, chat.name, chat.avatar, true)

		const ws = makeWakustore(this.waku)
		await ws.setDoc<StorageChat>('group-chats', chatId, chat)
		await this.subscribeToGroupChat(chatId, wallet.address, wakuObjectAdapter)

		return chatId
	}

	async addMemberToGroupChat(chatId: string, users: string[]): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const ws = makeWakustore(this.waku)

		const groupChat = await ws.getDoc<StorageChat>('group-chats', chatId)
		if (!groupChat) {
			return
		}

		const updatedGroupChat = {
			...groupChat,
			users: groupChat.users.concat(...users),
		}
		await ws.setDoc<StorageChat>('group-chats', chatId, updatedGroupChat)
	}

	async removeFromGroupChat(chatId: string, address: string): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const ws = makeWakustore(this.waku)

		const groupChat = await ws.getDoc<StorageChat>('group-chats', chatId)
		if (!groupChat) {
			return
		}
		const updatedGroupChat = {
			...groupChat,
			users: groupChat.users.filter((user) => user !== address),
		}

		await ws.setDoc<StorageChat>('group-chats', chatId, updatedGroupChat)
	}

	async saveGroupChatProfile(chatId: string, name?: string, avatar?: string): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const ws = makeWakustore(this.waku)

		const groupChat = await ws.getDoc<StorageChat>('group-chats', chatId)
		if (!groupChat) {
			return
		}

		const updatedGroupChat = {
			...groupChat,
			name: name ?? groupChat.name,
			avatar: avatar ?? groupChat.avatar,
		}
		await ws.setDoc<StorageChat>('group-chats', chatId, updatedGroupChat)
	}

	async sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const fromAddress = wallet.address
		const message: Message = {
			type: 'user',
			timestamp: Date.now(),
			text,
			fromAddress,
		}

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		await addMessageToChat(fromAddress, wakuObjectAdapter, chatId, message)
		await sendMessage(this.waku, chatId, message)
	}

	async sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: JSONSerializable,
	): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const fromAddress = wallet.address
		const message: Message = {
			type: 'data',
			timestamp: Date.now(),
			fromAddress,
			objectId,
			instanceId,
			data,
		}

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		await addMessageToChat(fromAddress, wakuObjectAdapter, chatId, message)
		await sendMessage(this.waku, chatId, message)
	}

	async sendInvite(wallet: BaseWallet, chatId: string, users: string[]): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		if (!isGroupChatId(chatId)) {
			throw 'chat id is private'
		}

		const fromAddress = wallet.address
		const message: Message = {
			type: 'invite',
			timestamp: Date.now(),
			fromAddress,
			chatId,
		}

		for (const user of users) {
			await sendMessage(this.waku, user, message)
		}
	}

	async updateStore(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_address: string,
		objectId: string,
		instanceId: string,
		updater: (state: JSONSerializable) => JSONSerializable,
	): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const key = objectKey(objectId, instanceId)
		const wakuObjectStore = get(objectStore)

		const objects = wakuObjectStore.objects
		const object = objects.get(key)
		if (!object) {
			return
		}
		const newStore = updater(object)
		const newObjects = new Map(objects)
		newObjects.set(key, newStore)
		objectStore.update((state) => ({ ...state, objects: newObjects, lastUpdated: Date.now() }))
	}

	async sendTransaction(wallet: Wallet, to: string, token: Token): Promise<string> {
		const tx = await sendTransaction(wallet, to, token.amount, token.address)
		return tx.hash
	}

	async estimateTransaction(): Promise<Token> {
		return {
			...defaultBlockchainNetwork.nativeToken,
			amount: 1000059237n,
		}
	}

	private async storageChatToChat(chatId: string, storageChat: StorageChat): Promise<Chat> {
		if (!this.waku) {
			throw 'no waku'
		}

		const userPromises = storageChat.users.map((user) => this.storageProfileToUser(user))
		const allUsers = await Promise.all(userPromises)
		const users = allUsers.filter((user) => user) as User[]

		return {
			chatId,
			messages: [],
			unread: 0,
			users,
			name: storageChat.name,
			avatar: storageChat.avatar,
		}
	}

	// fetches the profile from the network
	private async fetchStorageProfile(address: string): Promise<StorageProfile | undefined> {
		if (!this.waku) {
			throw 'no waku'
		}

		const ws = makeWakustore(this.waku)
		const storageProfile = await ws.getDoc<StorageProfile>('profile', address)

		return storageProfile
	}

	// optimised version that first checks if the user is a contact
	// then fetches from the network if not
	private async storageProfileToUser(address: string): Promise<User | undefined> {
		const contactUser = Array.from(get(chats).chats)
			.flatMap(([, chat]) => chat.users)
			.find((user) => user.address === address)

		if (contactUser) {
			return contactUser
		}

		const storageProfile = await this.fetchStorageProfile(address)
		if (!storageProfile) {
			return
		}

		const user = {
			name: storageProfile.name,
			avatar: storageProfile.avatar,
			address,
		}

		return user
	}

	private async subscribeToGroupChat(
		groupChatId: string,
		address: string,
		wakuObjectAdapter: WakuObjectAdapter,
		timeFilter?: TimeFilter,
	) {
		if (!this.waku) {
			return
		}

		const ws = makeWakustore(this.waku)

		const groupChatSubscription = await ws.onSnapshot<StorageChat>(
			ws.docQuery('group-chats', groupChatId),
			async (groupChat) => {
				if (groupChat.users.includes(address)) {
					const updatedGroupChat = await this.storageChatToChat(groupChatId, groupChat)
					chats.updateChat(groupChatId, (chat) => ({
						...chat,
						chatId: groupChatId,
						users: updatedGroupChat.users,
						name: updatedGroupChat.name,
						avatar: updatedGroupChat.avatar,
					}))
				} else {
					chats.removeChat(groupChatId)
				}
			},
		)
		this.subscriptions.push(groupChatSubscription)

		await this.subscribeToPrivateMessages(groupChatId, address, wakuObjectAdapter, timeFilter)
	}

	private async subscribeToPrivateMessages(
		id: string,
		address: string,
		wakuObjectAdapter: WakuObjectAdapter,
		timeFilter?: TimeFilter,
	) {
		if (!this.waku) {
			return
		}

		const ws = makeWakustore(this.waku)

		const startTime = new Date(getLastMessageTime(get(chats).chats.get(id)) + 1)
		const endTime = new Date()

		const subscription = await ws.onSnapshot<Message>(
			ws.collectionQuery('private-message', id, {
				timeFilter: timeFilter || { startTime, endTime },
				pageDirection: PageDirection.BACKWARD,
				pageSize: 1000,
			}),
			(message) => {
				this.queueMessage(message, address, id, wakuObjectAdapter)
			},
		)
		this.subscriptions.push(subscription)
	}

	private async queueMessage(
		message: Message,
		address: string,
		id: string,
		adapter: WakuObjectAdapter,
	) {
		this.queuedMessages.push({
			message,
			address,
			id,
			adapter,
		})

		if (this.isHandlingMessage) {
			return
		}

		this.isHandlingMessage = true

		while (this.queuedMessages.length > 0) {
			const queuedMessage = this.queuedMessages.shift()
			if (queuedMessage) {
				await this.handleMessage(
					queuedMessage.message,
					queuedMessage.address,
					queuedMessage.id,
					queuedMessage.adapter,
				)
			}
		}

		this.isHandlingMessage = false
	}

	private async handleMessage(
		message: Message,
		address: string,
		id: string,
		adapter: WakuObjectAdapter,
	) {
		// ignore messages coming from own address
		if (message.fromAddress === address) {
			return
		}

		const chatsMap = get(chats).chats

		if (isGroupChatId(id)) {
			if (!chatsMap.has(id)) {
				return
			}

			await addMessageToChat(address, adapter, id, message)

			return
		}

		// create group chat when invited
		if (message.type === 'invite') {
			if (chatsMap.has(message.chatId)) {
				return
			}
			createGroupChat(message.chatId, [], undefined, undefined, undefined, message.fromAddress)
			// add the message to the private chat of the inviter
			await addMessageToChat(address, adapter, message.fromAddress, message)
			await this.subscribeToGroupChat(message.chatId, address, adapter)

			return
		}

		// create chat if does not exist yet
		if (!chatsMap.has(message.fromAddress)) {
			const user = await this.storageProfileToUser(message.fromAddress)
			if (!user) {
				return
			}

			createPrivateChat(message.fromAddress, user, address)
		}

		await addMessageToChat(address, adapter, message.fromAddress, message)
	}

	private async updateContactProfiles() {
		// look for changes in users profile name and picture
		const contacts = Array.from(get(chats).chats).flatMap(([, chat]) => chat.users)
		const changes = new Map<string, User>()
		for (const contact of contacts) {
			const storageProfile = await this.fetchStorageProfile(contact.address)

			if (!storageProfile) {
				continue
			}

			if (storageProfile.name != contact.name || storageProfile.avatar != contact.avatar) {
				changes.set(contact.address, { ...storageProfile, address: contact.address })
			}
		}
		if (changes.size > 0) {
			chats.update((state) => {
				const newChats = new Map<string, Chat>(state.chats)
				changes.forEach((user) => {
					const chat = newChats.get(user.address)
					if (chat) {
						chat.users[0] = user
					}
				})
				return {
					...state,
					chats: newChats,
				}
			})
		}
	}

	private async saveChatStore(address: string) {
		if (!this.waku) {
			return
		}

		const ws = makeWakustore(this.waku)
		const chatData: ChatData = get(chats)

		const result = await ws.setDoc<StorageChatEntry[]>('chats', address, Array.from(chatData.chats))

		return result
	}
}
