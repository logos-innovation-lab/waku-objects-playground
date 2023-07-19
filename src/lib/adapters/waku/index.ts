import { profile, type Profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import { chats, type DraftChat, type Chat, type Message, type ChatData } from '$lib/stores/chat'
import { contacts, type User } from '$lib/stores/users'
import type { LightNode } from '@waku/interfaces'
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
import { ipfs, IPFS_GATEWAY } from '../firebase/connections'
import { get } from 'svelte/store'
import { objectStore, type ObjectState, objectKey } from '$lib/stores/objects'
import { lookup } from '$lib/objects/lookup'
import type { Token } from '$lib/stores/balances'
import { defaultBlockchainNetwork, sendTransaction } from '$lib/adapters/transaction'
import type { WakuObjectAdapter } from '$lib/objects'
import { makeWakuObjectAdapter } from '$lib/objects/adapter'
import { fetchBalances } from '$lib/adapters/balance'

function createChat(chatId: string, user: User, address: string): string {
	chats.update((state) => {
		if (state.chats.has(chatId)) {
			return state
		}
		if (!user) {
			return state
		}

		const newChats = new Map<string, Chat>(state.chats)
		const chat = {
			chatId: chatId,
			messages: [],
			users: [user, { address }],
			name: user.name ?? user.address,
		}
		newChats.set(chatId, chat)

		return {
			...state,
			chats: newChats,
			loading: false,
		}
	})
	return chatId
}

async function addMessageToChat(
	address: string,
	adapter: WakuObjectAdapter,
	chatId: string,
	message: Message,
) {
	await executeOnMessage(address, adapter, message)

	chats.update((state) => {
		if (!state.chats.has(chatId)) {
			return state
		}

		const newChats = new Map<string, Chat>(state.chats)
		const chat = newChats.get(chatId)
		if (chat) {
			chat.messages = [...chat.messages, message]
		}

		return {
			...state,
			chats: newChats,
			loading: false,
		}
	})
}

async function executeOnMessage(address: string, adapter: WakuObjectAdapter, chatMessage: Message) {
	if (chatMessage.type === 'data') {
		const descriptor = lookup(chatMessage.objectId)
		const key = objectKey(chatMessage.objectId, chatMessage.instanceId)
		const wakuObjectStore = get(objectStore)

		if (descriptor && descriptor.onMessage && wakuObjectStore.lastUpdated < chatMessage.timestamp) {
			const objects = wakuObjectStore.objects
			const store = objects.get(key)
			const updateStore = (updater: (store: unknown) => unknown) => {
				const newStore = updater(store)
				const newObjects = new Map(objects)
				newObjects.set(key, newStore)
				objectStore.update((state) => ({
					...state,
					objects: newObjects,
					lastUpdated: chatMessage.timestamp,
				}))
			}
			await descriptor.onMessage(address, adapter, store, updateStore, chatMessage)
		}
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

/*
 * Temporary helper function to read all users from the waku store, so that contacts are discoverable.
 * This functionality can be removed once the invite system is working.
 */
async function readAllUsers(waku: LightNode): Promise<User[]> {
	const results = await readStore(waku, 'all-users')
	const users = (await parseQueryResults(results)) as User[]
	return users
}

async function lookupUserFromContacts(waku: LightNode, address: string): Promise<User | undefined> {
	const users = await readAllUsers(waku)
	return users.find((user) => user.address === address)
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

		const allUsers = await readAllUsers(this.waku)
		if (!allUsers.find((user) => user.address === address)) {
			// save it in the waku store so that other users can find
			// this can be removed once the invite system is in place
			const selfUser: User = {
				...profileData,
				address,
			}
			await storeDocument(this.waku, 'all-users', '', selfUser)
		}
		const globalContacts = new Map<string, User>(
			allUsers.filter((user) => user.address !== address).map((user) => [user.address, user]),
		)

		contacts.update(() => ({
			contacts: new Map<string, User>(globalContacts),
			loading: false,
		}))

		const chatData = await readChats(this.waku, address)
		chats.update((state) => ({ ...state, ...chatData, loading: false }))

		// the adapter is stored to maintain a copy of the chats so that we don't have to lookup the users
		// from the waku store each time a message arrives

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const adapter = this
		const subscribeChatStore = chats.subscribe(async (chats) => {
			if (!adapter.waku) {
				return
			}
			await storeChats(adapter.waku, address, chats)
		})
		this.subscriptions.push(subscribeChatStore)

		const subscribeChats = await subscribe(
			this.waku,
			'private-message',
			address,
			async (msg: DecodedMessage) => {
				if (!adapter.waku) {
					return
				}

				const decodedPayload = decodeMessagePayload(msg)
				const chatMessage = JSON.parse(decodedPayload) as Message
				const chatsMap = get(chats).chats

				// FIXME: the message should be checked for validity
				if (!chatMessage) {
					console.error('Invalid message received')
					return
				}

				if (!chatsMap.has(chatMessage.fromAddress)) {
					const user = await lookupUserFromContacts(adapter.waku, chatMessage.fromAddress)
					if (user) {
						createChat(chatMessage.fromAddress, user, address)
					}
				}

				await addMessageToChat(address, wakuObjectAdapter, chatMessage.fromAddress, chatMessage)
			},
		)
		this.subscriptions.push(subscribeChats)

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
	}

	async onLogOut() {
		this.subscriptions.forEach((s) => s())
		this.subscriptions = []
		profile.set({ loading: false })
		contacts.set({ contacts: new Map<string, User>(), loading: true })
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

	async startChat(address: string, chat: DraftChat): Promise<string> {
		if (!this.waku) {
			throw 'no waku'
		}
		if (chat.users.length !== 2) {
			throw 'invalid chat'
		}

		const chatId = chat.users[0]
		const user = await lookupUserFromContacts(this.waku, chatId)
		if (!user) {
			throw 'invalid user'
		}

		createChat(chatId, user, address)

		return chatId
	}

	async sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void> {
		if (!this.waku) {
			throw 'no waku'
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
		wallet: Wallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: unknown,
	): Promise<void> {
		if (!this.waku) {
			throw 'no waku'
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

	async uploadPicture(picture: string): Promise<string> {
		const blob = await (await fetch(picture)).blob()
		const res = await ipfs.add(blob)

		return res.cid.toString()
	}

	getPicture(cid: string): string {
		return `${IPFS_GATEWAY}/${cid}`
	}

	async updateStore(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		address: string,
		objectId: string,
		instanceId: string,
		updater: (state: unknown) => unknown,
	): Promise<void> {
		if (!this.waku) {
			throw 'no waku'
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

	async sendTransaction(wallet: Wallet, to: string, token: Token, fee: Token): Promise<string> {
		const tx = await sendTransaction(wallet, to, token.amount, fee.amount)
		return tx.hash
	}

	async estimateTransaction(): Promise<Token> {
		return {
			...defaultBlockchainNetwork.nativeToken,
			amount: 1000059237n,
		}
	}
}
