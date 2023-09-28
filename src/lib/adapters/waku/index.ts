import { profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import {
	chats,
	type Chat,
	type Message,
	isGroupChatId,
	type DataMessage,
	getLastSeenMessageTime,
	type ChatData,
	getLastMessageTime,
} from '$lib/stores/chat'
import type { User } from '$lib/types'
import type { TimeFilter } from '@waku/interfaces'
import type { BaseWallet, Wallet } from 'ethers'
import { get } from 'svelte/store'
import { objectStore, objectKey } from '$lib/stores/objects'
import { lookup } from '$lib/objects/lookup'
import {
	defaultBlockchainNetwork,
	sendTransaction,
	estimateTransaction,
} from '$lib/adapters/transaction'
import type {
	JSONSerializable,
	JSONValue,
	WakuObjectAdapter,
	WakuObjectArgs,
	WakuObjectContext,
} from '$lib/objects'
import { makeWakuObjectAdapter } from '$lib/objects/adapter'
import { fetchBalances } from '$lib/adapters/balance'
import { makeWakustore } from './wakustore'
import type { StorageChat, StorageChatEntry, StorageObjectEntry, StorageProfile } from './types'
import { walletStore } from '$lib/stores/wallet'
import { SafeWaku } from './safe-waku'
import type { TokenAmount } from '$lib/objects/schemas'
import { DEFAULT_FIAT_SYMBOL, exchangeStore } from '$lib/stores/exchangeRates'

const MAX_MESSAGES = 100

function createPrivateChat(
	chatId: string,
	user: User,
	ownAddress: string,
	joined?: boolean,
): string {
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
		joined,
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
	blockchainAdapter: WakuObjectAdapter,
	chatId: string,
	message: Message,
	send?: (data: JSONValue) => Promise<void>,
) {
	if (message.type === 'data' && send) {
		await executeOnDataMessage(address, blockchainAdapter, chatId, message, send)
	}

	const unread = message.fromAddress !== address && message.type === 'user' ? 1 : 0
	chats.updateChat(chatId, (chat) => ({
		...chat,
		messages: [...chat.messages.slice(-MAX_MESSAGES), message],
		unread: chat.unread + unread,
	}))
}

async function executeOnDataMessage(
	address: string,
	blockchainAdapter: WakuObjectAdapter,
	chatId: string,
	dataMessage: DataMessage,
	send: (data: JSONValue) => Promise<void>,
) {
	const descriptor = lookup(dataMessage.objectId)
	const key = objectKey(dataMessage.objectId, dataMessage.instanceId)
	const wakuObjectStore = get(objectStore)

	if (descriptor && descriptor.onMessage && wakuObjectStore.lastUpdated < dataMessage.timestamp) {
		const objects = wakuObjectStore.objects
		const updateStore = (updater: (_store?: JSONSerializable) => JSONSerializable) => {
			const store = objects.get(key)
			const newStore = updater(store)
			objects.set(key, newStore)
			objectStore.update((state) => ({
				...state,
				objects,
				lastUpdated: dataMessage.timestamp,
			}))
		}
		const store = objects.get(key)
		const context: WakuObjectContext = {
			...blockchainAdapter,
			viewParams: [],
			store,
			updateStore,
			send,
			onViewChange: () => {
				// TODO this is not really needed for the `onMessage` handler anyways
				throw 'not implemented'
			},
		}
		const chat = get(chats).chats.get(chatId)
		const users = chat ? chat.users : []
		const myProfile: User = { ...get(profile), address }
		const chatName =
			chat?.name ?? users.find((u) => u.address !== myProfile.address)?.name ?? 'Unknown'
		const args: WakuObjectArgs = {
			...context,
			chatName,
			chatId,
			objectId: dataMessage.objectId,
			instanceId: dataMessage.instanceId,
			users: users,
			profile: myProfile,
			exchangeRates: get(exchangeStore).exchange,
			fiatSymbol: DEFAULT_FIAT_SYMBOL,
			tokens: defaultBlockchainNetwork.tokens?.map((t) => ({ ...t, amount: 0n })) || [],
		}
		await descriptor.onMessage(dataMessage, args)
	}
}

export default class WakuAdapter implements Adapter {
	private safeWaku = new SafeWaku()
	private subscriptions: Array<() => void> = []

	async onLogIn(wallet: BaseWallet): Promise<void> {
		const address = wallet.address

		const ws = await this.makeWakustore()
		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		const storageProfile = await ws.getDoc<StorageProfile>('profile', address)
		profile.update((state) => ({ ...state, ...storageProfile, address, loading: false }))

		const storageChatEntries = await ws.getDoc<StorageChatEntry[]>('chats', address)
		chats.update((state) => ({ ...state, chats: new Map(storageChatEntries), loading: false }))

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
		const groupChats = allChats.filter(([id]) => isGroupChatId(id)).map(([, chat]) => chat)

		for (const groupChat of groupChats) {
			const groupChatId = groupChat.chatId
			const lastSeenMessageTime = getLastMessageTime(groupChat)
			const now = new Date()
			const timeFilter = {
				startTime: new Date(lastSeenMessageTime + 1),
				endTime: now,
			}
			await this.subscribeToGroupChat(groupChatId, address, wakuObjectAdapter, timeFilter)
		}

		// chat store
		let firstChatStoreSave = true
		let chatSaveTimeout: ReturnType<typeof setTimeout> | undefined = undefined
		const subscribeChatStore = chats.subscribe(async () => {
			if (firstChatStoreSave) {
				firstChatStoreSave = false
				return
			}
			// debounce saving changes
			if (chatSaveTimeout) {
				clearTimeout(chatSaveTimeout)
			}

			chatSaveTimeout = setTimeout(async () => {
				chatSaveTimeout = undefined
				await this.saveChatStore(address)
			}, 1000)
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

		let firstObjectStoreSave = true
		const subscribeObjectStore = objectStore.subscribe(async (objects) => {
			if (firstObjectStoreSave) {
				firstObjectStoreSave = false
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
		await this.safeWaku.unsubscribeAll()
		this.subscriptions.forEach((s) => s())
		this.subscriptions = []
		profile.set({ loading: false })
	}

	async saveUserProfile(address: string, name?: string, avatar?: string): Promise<void> {
		const defaultProfile: StorageProfile = { name: name ?? address }
		const storageProfile = (await this.fetchStorageProfile(address)) || defaultProfile

		if (avatar) storageProfile.avatar = avatar
		if (name) storageProfile.name = name

		if (avatar || name) {
			const ws = await this.makeWakustore()
			ws.setDoc<StorageProfile>('profile', address, storageProfile)
			profile.update((state) => ({ ...state, address, name, avatar }))
		}
	}

	async getUserProfile(address: string): Promise<User | undefined> {
		return this.storageProfileToUser(address)
	}

	async startChat(address: string, peerAddress: string): Promise<string> {
		const chatId = peerAddress
		const user = await this.storageProfileToUser(chatId)
		if (!user) {
			throw 'invalid user'
		}

		const joined = true
		createPrivateChat(chatId, user, address, joined)

		return chatId
	}

	async startGroupChat(
		wallet: BaseWallet,
		chatId: string,
		memberAddresses: string[],
		name: string,
		avatar?: string,
	): Promise<string> {
		if (memberAddresses.length === 0) {
			throw 'invalid chat'
		}

		const userAddresses = [...memberAddresses, wallet.address]
		const storageChat = {
			users: userAddresses,
			name,
			avatar,
		}
		const chat = await this.storageChatToChat(chatId, storageChat)
		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		createGroupChat(chatId, chat.users, name, avatar, true)

		const ws = await this.makeWakustore()
		await ws.setDoc<StorageChat>('group-chats', chatId, storageChat)
		await this.subscribeToGroupChat(chatId, wallet.address, wakuObjectAdapter)

		return chatId
	}

	async addMemberToGroupChat(chatId: string, users: string[]): Promise<void> {
		const ws = await this.makeWakustore()

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
		const ws = await this.makeWakustore()

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
		const ws = await this.makeWakustore()

		const groupChat = await ws.getDoc<StorageChat>('group-chats', chatId)
		if (!groupChat) {
			return
		}

		groupChat.name = name ?? groupChat.name
		groupChat.avatar = avatar ?? groupChat.avatar

		await ws.setDoc<StorageChat>('group-chats', chatId, groupChat)
	}

	async sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void> {
		const fromAddress = wallet.address
		const message: Message = {
			type: 'user',
			timestamp: Date.now(),
			text,
			fromAddress,
		}

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		await addMessageToChat(fromAddress, wakuObjectAdapter, chatId, message)
		await this.safeWaku.sendMessage(chatId, message)
	}

	async sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: JSONSerializable,
	): Promise<void> {
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
		const send = (data: JSONValue) => this.sendData(wallet, chatId, objectId, instanceId, data)

		await addMessageToChat(fromAddress, wakuObjectAdapter, chatId, message, send)
		await this.safeWaku.sendMessage(chatId, message)
	}

	async sendInvite(wallet: BaseWallet, chatId: string, users: string[]): Promise<void> {
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
			await this.safeWaku.sendMessage(user, message)
		}
	}

	async updateStore(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_address: string,
		objectId: string,
		instanceId: string,
		updater: (state: JSONSerializable) => JSONSerializable,
	): Promise<void> {
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

	async sendTransaction(wallet: Wallet, to: string, token: TokenAmount): Promise<string> {
		const tx = await sendTransaction(wallet, to, token.amount, token.address)
		return tx.hash
	}

	async estimateTransaction(wallet: Wallet, to: string, token: TokenAmount): Promise<TokenAmount> {
		const fee = await estimateTransaction(wallet, to, token.amount, token.address)
		return {
			...defaultBlockchainNetwork.nativeToken,
			amount: fee,
		}
	}

	private async makeWakustore() {
		const waku = await this.safeWaku.connect()
		return makeWakustore(waku)
	}

	private async storageChatToChat(chatId: string, storageChat: StorageChat): Promise<Chat> {
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
		const ws = await this.makeWakustore()
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
		const ws = await this.makeWakustore()

		const groupChat = await ws.getDoc<StorageChat>('group-chats', groupChatId)
		if (groupChat) {
			const updatedGroupChat = await this.storageChatToChat(groupChatId, groupChat)
			chats.updateChat(groupChatId, (chat) => ({
				...chat,
				chatId: groupChatId,
				users: updatedGroupChat.users,
				name: updatedGroupChat.name,
				avatar: updatedGroupChat.avatar,
			}))
		}

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
		this.safeWaku.subscribe(id, timeFilter, (message, chatId) =>
			this.handleMessage(message, address, chatId, wakuObjectAdapter),
		)
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
			let send: undefined | ((data: JSONValue) => Promise<void>) = undefined

			if (message.type === 'data') {
				// FIXME: @agazso figure out how to get wallet here without using the store
				const wallet = get(walletStore).wallet
				if (wallet) {
					const { instanceId, objectId } = message
					send = (data: JSONValue) => this.sendData(wallet, id, objectId, instanceId, data)
				}
			}

			await addMessageToChat(address, adapter, id, message, send)

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

		let send: undefined | ((data: JSONValue) => Promise<void>) = undefined

		if (message.type === 'data') {
			// FIXME: @agazso figure out how to get wallet here without using the store
			const wallet = get(walletStore).wallet
			if (wallet) {
				const { instanceId, objectId } = message
				send = (data: JSONValue) => this.sendData(wallet, id, objectId, instanceId, data)
			}
		}
		await addMessageToChat(address, adapter, message.fromAddress, message, send)
	}

	private async updateContactProfiles() {
		// look for changes in users profile name and picture
		const allContacts = Array.from(get(chats).chats).flatMap(([, chat]) => chat.users)
		const uniqueContacts = new Map<string, User>(allContacts.map((user) => [user.address, user]))
		const changes = new Map<string, User>()
		for (const contact of uniqueContacts) {
			const user = contact[1]
			const storageProfile = await this.fetchStorageProfile(user.address)

			if (!storageProfile) {
				continue
			}

			if (storageProfile.name != user.name || storageProfile.avatar != user.avatar) {
				changes.set(user.address, { ...storageProfile, address: user.address })
			}
		}
		if (changes.size > 0) {
			chats.update((state) => {
				const newChats = new Map<string, Chat>(state.chats)
				newChats.forEach((chat) => {
					chat.users.forEach((user) => {
						const changedUser = changes.get(user.address)
						if (!changedUser) {
							return
						}
						user.name = changedUser.name
						user.avatar = changedUser.avatar
					})
				})
				return {
					...state,
					chats: newChats,
				}
			})
		}
	}

	private async saveChatStore(address: string) {
		const ws = await this.makeWakustore()
		const chatData: ChatData = get(chats)

		const result = await ws.setDoc<StorageChatEntry[]>('chats', address, Array.from(chatData.chats))

		return result
	}
}
