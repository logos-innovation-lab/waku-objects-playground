import { profile, type Profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import {
	chats,
	type DraftChat,
	type Chat,
	type Message,
	type ChatData,
	isGroupChatId,
	type DataMessage,
} from '$lib/stores/chat'
import type { User } from '$lib/types'
import { PageDirection, type LightNode, type StoreQueryOptions } from '@waku/interfaces'
import type { DecodedMessage } from '@waku/sdk'
import {
	connectWaku,
	decodeMessagePayload,
	parseQueryResults,
	readLatestDocument,
	readStore,
	sendMessage,
	storeDocument,
	subscribe,
} from './waku'
import type { BaseWallet, Wallet } from 'ethers'
import { get } from 'svelte/store'
import { objectStore, type ObjectState, objectKey } from '$lib/stores/objects'
import { lookup } from '$lib/objects/lookup'
import type { Token } from '$lib/stores/balances'
import { defaultBlockchainNetwork, sendTransaction } from '$lib/adapters/transaction'
import type { WakuObjectAdapter } from '$lib/objects'
import { makeWakuObjectAdapter } from '$lib/objects/adapter'
import { fetchBalances } from '$lib/adapters/balance'

function createChat(chatId: string, user: User, address: string): string {
	const chat = {
		chatId: chatId,
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
		chatId: chatId,
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

async function readChats(waku: LightNode, address: string): Promise<ChatData> {
	const chatDataChats = (await readLatestDocument(waku, 'chats', address)) as [string, Chat][]
	return {
		loading: false,
		chats: new Map(chatDataChats),
	}
}

async function storeChats(waku: LightNode, address: string, chatData: ChatData) {
	await storeDocument(waku, 'chats', address, Array.from(chatData.chats.entries()))
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

async function subscribeToPrivateMessages(
	waku: LightNode,
	adapter: WakuObjectAdapter,
	address: string,
	ids: string[],
	subscriptions: Array<() => void>,
): Promise<void> {
	for (const id of ids) {
		const subscription = await subscribe(
			waku,
			'private-message',
			id,
			async (msg: DecodedMessage) => {
				const decodedPayload = decodeMessagePayload(msg)
				const chatMessage = JSON.parse(decodedPayload) as Message
				const chatsMap = get(chats).chats

				// FIXME: the message should be checked for validity
				if (!chatMessage) {
					console.error('Invalid message received')
					return
				}

				// ignore messages coming from own address
				if (chatMessage.fromAddress === address) {
					return
				}

				if (chatMessage.type === 'invite') {
					const groupChat = await readGroupChat(waku, chatMessage.chatId)
					const userPromises = groupChat.users.map((address) => readUserFromProfile(waku, address))
					const allUsers = await Promise.all(userPromises)
					const users = allUsers.filter((user) => user) as User[]
					createGroupChat(chatMessage.chatId, users, groupChat.name, groupChat.avatar, false, chatMessage.fromAddress)

					await subscribeToPrivateMessages(
						waku,
						adapter,
						address,
						[chatMessage.chatId],
						subscriptions,
					)
				} else {
					if (!isGroupChatId(id)) {
						if (!chatsMap.has(chatMessage.fromAddress)) {
							const storedProfile = (await readLatestDocument(
								waku,
								'profile',
								chatMessage.fromAddress,
							)) as Profile

							if (storedProfile) {
								const user = {
									name: storedProfile.name,
									avatar: storedProfile.avatar,
									address: chatMessage.fromAddress,
								}
								createChat(chatMessage.fromAddress, user, address)
							}
						}

						await addMessageToChat(address, adapter, chatMessage.fromAddress, chatMessage)
					} else {
						await addMessageToChat(address, adapter, id, chatMessage)
					}
				}
			},
		)
		subscriptions.push(subscription)
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

async function readGroupChatInvites(waku: LightNode, address: string) {
	const storeQueryOptions: StoreQueryOptions = {
		pageDirection: PageDirection.BACKWARD,
		pageSize: 100,
	}

	const results = await readStore(waku, 'private-message', address, storeQueryOptions)
	const messages = await parseQueryResults<Message>(results)

	const storeChats = get(chats).chats
	for (const message of messages) {
		if (message.type === 'invite') {
			if (!storeChats.get(message.chatId)) {
				const groupChat = await readGroupChat(waku, message.chatId)
				if (!groupChat) {
					continue
				}
				const userPromises = groupChat.users.map((address) => readUserFromProfile(waku, address))
				const allUsers = await Promise.all(userPromises)
				const users = allUsers.filter((user) => user) as User[]
				createGroupChat(message.chatId, users, groupChat.name, groupChat.avatar, false, message.fromAddress)
			}
		}
	}
}

export default class WakuAdapter implements Adapter {
	private waku: LightNode | undefined
	private subscriptions: Array<() => void> = []

	async onLogIn(wallet: BaseWallet): Promise<void> {
		const address = wallet.address
		this.waku = await connectWaku()

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		const profileData = (await readLatestDocument(this.waku, 'profile', address)) as Profile
		profile.update((state) => ({ ...state, ...profileData, address, loading: false }))

		const chatData = await readChats(this.waku, address)
		chats.update((state) => ({ ...state, ...chatData, loading: false }))

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const adapter = this
		const subscribeChatStore = chats.subscribe(async (chats) => {
			if (!adapter.waku) {
				return
			}
			await storeChats(adapter.waku, address, chats)
		})
		this.subscriptions.push(subscribeChatStore)

		await readGroupChatInvites(this.waku, address)

		const groupChatIds = Array.from(get(chats).chats)
			.filter(([id]) => isGroupChatId(id))
			.map(([id]) => id)

		subscribeToPrivateMessages(
			this.waku,
			wakuObjectAdapter,
			address,
			[address, ...groupChatIds],
			this.subscriptions,
		)

		const objects = await readObjectStore(this.waku, address)
		objectStore.update((state) => ({ ...state, ...objects, loading: false }))

		const subscribeObjectStore = objectStore.subscribe(async (objects) => {
			if (!adapter.waku) {
				return
			}
			await storeObjectStore(adapter.waku, address, objects)
		})
		this.subscriptions.push(subscribeObjectStore)

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
		await subscribeToPrivateMessages(
			this.waku,
			wakuObjectAdapter,
			wallet.address,
			[chatId],
			this.subscriptions,
		)

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
