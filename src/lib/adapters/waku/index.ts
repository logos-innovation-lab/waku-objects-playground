import { profile, type Profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import {
	chats,
	type DraftChat,
	type Chat,
	type Message,
	isGroupChatId,
	type DataMessage,
} from '$lib/stores/chat'
import type { User } from '$lib/types'
import { PageDirection, type LightNode, type TimeFilter } from '@waku/interfaces'
import { connectWaku, readLatestDocument, sendMessage, storeDocument } from './waku'
import type { BaseWallet, Wallet } from 'ethers'
import { get } from 'svelte/store'
import { objectStore, type ObjectState, objectKey } from '$lib/stores/objects'
import { lookup } from '$lib/objects/lookup'
import type { Token } from '$lib/stores/balances'
import { defaultBlockchainNetwork, sendTransaction } from '$lib/adapters/transaction'
import type { WakuObjectAdapter } from '$lib/objects'
import { makeWakuObjectAdapter } from '$lib/objects/adapter'
import { fetchBalances } from '$lib/adapters/balance'
import { makeWakustore } from './wakustore'
import type { StorageChat, StorageChatEntry, StorageProfile } from './types'

function createChat(chatId: string, user: User, address: string): string {
	const chat = {
		chatId,
		messages: [],
		users: [user, { address }],
		name: user.name ?? user.address,
		unread: 0, // FIXME: this should be calculated
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

	chats.updateChat(chatId, (chat) => ({ ...chat, messages: [...chat.messages, message] }))
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
		const updateStore = (updater: (_store: unknown) => unknown) => {
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

async function readObjectStore(waku: LightNode, address: string): Promise<ObjectState> {
	const objectStoreData = (await readLatestDocument(waku, 'objects', address)) as [
		string,
		unknown,
	][]
	return {
		loading: false,
		objects: new Map(objectStoreData),
		lastUpdated: Date.now(),
	}
}

async function storeObjectStore(waku: LightNode, address: string, objectStore: ObjectState) {
	await storeDocument(waku, 'objects', address, Array.from(objectStore.objects))
}

async function readGroupChat(waku: LightNode, id: string): Promise<DraftChat> {
	const groupChat = (await readLatestDocument(waku, 'group-chats', id)) as DraftChat
	return groupChat
}

async function storeGroupChat(waku: LightNode, id: string, groupChat: DraftChat) {
	await storeDocument(waku, 'group-chats', id, groupChat)
}

async function readUserFromProfile(waku: LightNode, address: string) {
	const profile = (await readLatestDocument(waku, 'profile', address)) as Profile | undefined
	if (profile) {
		return {
			name: profile.name,
			avatar: profile.avatar,
			address,
		}
	}
}

async function updateContactProfiles(waku: LightNode) {
	// look for changes in users profile name and picture
	const contacts = Array.from(get(chats).chats).flatMap(([, chat]) => chat.users)
	const changes = new Map<string, User>()
	for (const contact of contacts) {
		const contactProfile = (await readLatestDocument(waku, 'profile', contact.address)) as Profile

		if (!contactProfile) {
			continue
		}

		if (contactProfile.name != contact.name || contactProfile.avatar != contact.avatar) {
			const changedUser = {
				name: contactProfile.name,
				avatar: contactProfile.avatar,
				address: contact.address,
			}
			changes.set(contact.address, changedUser)
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

function getLastSeenMessageTime(chats: Chat[]) {
	let lastMessageTime = 0
	for (const chat of chats) {
		const time = getLastMessageTime(chat)
		if (time > lastMessageTime) {
			lastMessageTime = time
		}
	}
	return lastMessageTime
}

function getLastMessageTime(chat?: Chat) {
	const lastMessage = chat?.messages.slice(-1)[0]
	return lastMessage ? lastMessage.timestamp : 0
}

export default class WakuAdapter implements Adapter {
	private waku: LightNode | undefined
	private subscriptions: Array<() => void> = []

	private async storageChatToChat(chatId: string, storageChat: StorageChat): Promise<Chat> {
		if (!this.waku) {
			throw 'no waku'
		}

		const waku = this.waku
		const userPromises = storageChat.users.map((address) => readUserFromProfile(waku, address))
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

	private async storageProfileToUser(address: string): Promise<User | undefined> {
		if (!this.waku) {
			throw 'no waku'
		}

		const waku = this.waku
		const storageProfile = await readUserFromProfile(waku, address)
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
				const updatedGroupChat = await this.storageChatToChat(groupChatId, groupChat)
				chats.updateChat(groupChatId, (chat) => ({
					...chat,
					chatId: groupChatId,
					users: updatedGroupChat.users,
					name: updatedGroupChat.name,
					avatar: updatedGroupChat.avatar,
				}))
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

		const startTime = new Date(getLastMessageTime(get(chats).chats.get(id)))
		const endTime = new Date()

		const subscription = await ws.onSnapshot<Message>(
			ws.collectionQuery('private-message', id, {
				timeFilter: timeFilter || { startTime, endTime },
				pageDirection: PageDirection.BACKWARD,
				pageSize: 1000,
			}),
			(message) => {
				this.handleMessage(message, address, id, wakuObjectAdapter)
			},
		)
		this.subscriptions.push(subscription)
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
			createGroupChat(message.chatId, [])
			await this.subscribeToGroupChat(message.chatId, address, adapter)

			return
		}

		// create chat if does not exist yet
		if (!chatsMap.has(message.fromAddress)) {
			const user = await this.storageProfileToUser(message.fromAddress)
			if (!user) {
				return
			}

			createChat(message.fromAddress, user, address)
		}

		await addMessageToChat(address, adapter, message.fromAddress, message)
	}

	async onLogIn(wallet: BaseWallet): Promise<void> {
		const address = wallet.address
		this.waku = await connectWaku()

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		const ws = makeWakustore(this.waku)

		const storageProfile = await ws.getDoc<StorageProfile>('profile', address)
		profile.update((state) => ({ ...state, ...storageProfile, address, loading: false }))

		console.debug({ storageProfile })

		const storageChatEntries = await ws.getDoc<StorageChatEntry[]>('chats', address)
		chats.update((state) => ({ ...state, chats: new Map(storageChatEntries), loading: false }))

		console.debug({ storageChatEntries })

		console.debug({ chats: get(chats) })

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const adapter = this
		// const subscribeChatStore = chats.subscribe((chatData) => {
		// 	if (adapter.updating.includes(chats)) {
		// 		return
		// 	}
		// 	ws.setDoc<StorageChatEntry[]>('chats', address, Array.from(chatData.chats))
		// })
		// this.subscriptions.push(subscribeChatStore)

		const allChats = Array.from(get(chats).chats)

		// private chats
		const privateChats = allChats.filter(([id]) => !isGroupChatId(id)).map(([, chat]) => chat)

		const lastSeenMessageTime = getLastSeenMessageTime(privateChats)
		const now = new Date()
		const timeFilter = {
			startTime: new Date(lastSeenMessageTime),
			endTime: now,
		}
		await this.subscribeToPrivateMessages(address, address, wakuObjectAdapter, timeFilter)

		// group chats
		const groupChatIds = allChats.filter(([id]) => isGroupChatId(id)).map(([id]) => id)

		for (const groupChatId of groupChatIds) {
			await this.subscribeToGroupChat(groupChatId, address, wakuObjectAdapter)
		}

		// object store
		const objects = await readObjectStore(this.waku, address)
		objectStore.update((state) => ({ ...state, ...objects, loading: false }))

		const subscribeObjectStore = objectStore.subscribe(async (objects) => {
			if (!adapter.waku) {
				return
			}
			await storeObjectStore(adapter.waku, address, objects)
		})
		this.subscriptions.push(subscribeObjectStore)

		// deferred updates
		fetchBalances(address)
		updateContactProfiles(this.waku)
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
		let updatedProfile: Profile = {
			loading: false,
		}
		const storedProfile = (await readLatestDocument(this.waku, 'profile', address)) as Profile
		updatedProfile = {
			...storedProfile,
		}

		if (avatar) updatedProfile.avatar = avatar
		if (name) updatedProfile.name = name

		if (avatar || name) {
			await storeDocument(this.waku, 'profile', address, updatedProfile)
			profile.update((state) => ({ ...state, address, name, avatar }))
		}
	}

	async getUserProfile(address: string): Promise<User | undefined> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}
		return readUserFromProfile(this.waku, address)
	}

	async startChat(address: string, chat: DraftChat): Promise<string> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}
		if (chat.users.length !== 2) {
			throw 'invalid chat'
		}

		const chatId = chat.users[0]
		const storedProfile = (await readLatestDocument(this.waku, 'profile', chatId)) as Profile
		if (!storedProfile) {
			throw 'invalid user'
		}

		const user = {
			name: storedProfile.name,
			avatar: storedProfile.avatar,
			address: chatId,
		}

		createChat(chatId, user, address)

		return chatId
	}

	async startGroupChat(wallet: BaseWallet, chat: DraftChat): Promise<string> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}
		if (chat.users.length === 0) {
			throw 'invalid chat'
		}

		const genRanHex = (size: number) =>
			[...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
		const chatId = genRanHex(64)

		const waku = this.waku
		const userPromises = chat.users.map((address) => readUserFromProfile(waku, address))
		const allUsers = await Promise.all(userPromises)
		const users = allUsers.filter((user) => user) as User[]

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		createGroupChat(chatId, users, chat.name, chat.avatar, true)
		await storeGroupChat(this.waku, chatId, chat)
		await this.subscribeToGroupChat(chatId, wallet.address, wakuObjectAdapter)

		return chatId
	}

	async addMemberToGroupChat(chatId: string, users: string[]): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const waku = this.waku
		const groupChat = await readGroupChat(this.waku, chatId)
		const updatedGroupChat = {
			...groupChat,
			users: groupChat.users.concat(...users),
		}
		await storeGroupChat(this.waku, chatId, updatedGroupChat)

		const newUserPromises = users.map((address) => readUserFromProfile(waku, address))
		const newResolvedUsers = await Promise.all(newUserPromises)
		const newUsers = newResolvedUsers.filter((user) => user) as User[]

		chats.updateChat(chatId, (chat) => ({ ...chat, users: [...chat.users, ...newUsers] }))
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
		data: unknown,
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
		address: string,
		objectId: string,
		instanceId: string,
		updater: (state: unknown) => unknown,
	): Promise<void> {
		if (!this.waku) {
			this.waku = await connectWaku()
		}

		const key = objectKey(objectId, instanceId)
		const wakuObjectStore = get(objectStore)

		const objects = wakuObjectStore.objects
		const newStore = updater(objects.get(key))
		const newObjects = new Map(objects)
		newObjects.set(key, newStore)
		objectStore.update((state) => ({ ...state, objects: newObjects, lastUpdated: Date.now() }))

		const updatedObjectStore = get(objectStore)
		await storeObjectStore(this.waku, address, updatedObjectStore)
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
}
