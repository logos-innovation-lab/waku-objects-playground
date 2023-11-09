import { profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import {
	chats,
	type Chat,
	type Message,
	isGroupChat,
	type DataMessage,
	type ChatData,
	getLastMessageTime,
	type InviteMessage,
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
import { makeWakustore, type Wakustore } from './wakustore'
import type {
	StorageChat,
	StorageChatEntry,
	StorageInstalledObjectEntry,
	StorageObjectEntry,
	StorageProfile,
} from './types'
import { walletStore } from '$lib/stores/wallet'
import { SafeWaku } from './safe-waku'
import type { TokenAmount } from '$lib/objects/schemas'
import { exchangeStore } from '$lib/stores/exchangeRates'
import { preferences } from '$lib/stores/preferences'
import { balanceStore } from '$lib/stores/balances'
import type { ContentTopic } from './waku'
import { installedObjectStore } from '$lib/stores/installed-objects'
import { errorStore } from '$lib/stores/error'
import { compressPublicKey, fixHex, getSharedSecret, hash } from './crypto'
import { bytesToHex, hexToBytes } from '@waku/utils/bytes'
import { encrypt, decrypt } from './crypto'
import { createSymmetricDecoder, createSymmetricEncoder } from './codec'
import type { DecodedMessage } from '@waku/message-encryption'

const MAX_MESSAGES = 100

function createPrivateChat(
	chatId: string,
	user: User,
	ownPublicKey: string,
	joined?: boolean,
): string {
	const ownProfile = get(profile)
	const ownUser = {
		name: ownProfile.name,
		avatar: ownProfile.avatar,
		publicKey: ownPublicKey,
	}
	const chat: Chat = {
		chatId,
		type: 'private',
		messages: [],
		users: [user, ownUser],
		name: user.name ?? user.publicKey,
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
	const groupChat: Chat = {
		chatId,
		type: 'group',
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
	ownPublicKey: string,
	blockchainAdapter: WakuObjectAdapter,
	chatId: string,
	message: Message,
	send?: (data: JSONValue) => Promise<void>,
) {
	if (message.type === 'data' && send) {
		await executeOnDataMessage(ownPublicKey, blockchainAdapter, chatId, message, send)
	}

	const unread = message.senderPublicKey !== ownPublicKey && message.type === 'user' ? 1 : 0
	chats.updateChat(chatId, (chat) => ({
		...chat,
		messages: [...chat.messages.slice(-MAX_MESSAGES), message],
		unread: chat.unread + unread,
	}))
}

async function executeOnDataMessage(
	publicKey: string,
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
			addError: errorStore.addEnd,
			updateStore,
			send,
			onViewChange: () => {
				// TODO this is not really needed for the `onMessage` handler anyways
				throw 'not implemented'
			},
		}
		const chat = get(chats).chats.get(chatId)
		if (!chat) {
			return
		}
		const users = chat.users
		const myProfile: User = { ...get(profile), publicKey }
		const chatName =
			chat?.name ?? users.find((u) => u.publicKey !== myProfile.publicKey)?.name ?? 'Unknown'
		const args: WakuObjectArgs = {
			...context,
			chainId: defaultBlockchainNetwork.chainId,
			chatName,
			chatType: chat.type,
			chatId,
			objectId: dataMessage.objectId,
			instanceId: dataMessage.instanceId,
			users: users,
			profile: myProfile,
			exchangeRates: get(exchangeStore).exchange,
			fiatSymbol: get(preferences).fiatSymbol,
			tokens: get(balanceStore).balances,
		}
		await descriptor.onMessage(dataMessage, args)
	}
}

function decryptHexToString(h: string, symKey: Uint8Array): string {
	const encrypted = hexToBytes(h)
	const decrypted = decrypt(encrypted, symKey)
	return new TextDecoder().decode(decrypted)
}

function encryptStringToHex(s: string, symKey: Uint8Array): string {
	const plaintext = new TextEncoder().encode(s)
	const encrypted = encrypt(plaintext, symKey)
	return bytesToHex(encrypted)
}

async function getDoc<T>(
	ws: Wakustore,
	contentTopic: ContentTopic,
	symKey: Uint8Array,
): Promise<T | undefined> {
	const id = hash(symKey)
	const key = `${contentTopic}/${id}`
	const hashedKey = hash(new TextEncoder().encode(key))
	const value = localStorage.getItem(hashedKey)

	if (value && value !== 'undefined') {
		const decryptedValue = decryptHexToString(value, symKey)
		return JSON.parse(decryptedValue) as T
	}

	const decoder = createSymmetricDecoder({ contentTopic, symKey })
	const storeValue = await ws.getDoc<T>(decoder)
	if (!storeValue) {
		return
	}

	const json = JSON.stringify(storeValue)
	const encryptedJson = encryptStringToHex(json, symKey)
	localStorage.setItem(hashedKey, encryptedJson)

	return storeValue
}

async function setDoc<T>(
	ws: Wakustore,
	contentTopic: ContentTopic,
	symKey: Uint8Array,
	sigPrivKey: Uint8Array,
	doc: T,
) {
	if (!doc) {
		return
	}

	const id = hash(symKey)
	const key = `${contentTopic}/${id}`
	const hashedKey = hash(new TextEncoder().encode(key))
	const json = JSON.stringify(doc)
	const encryptedJson = encryptStringToHex(json, symKey)

	localStorage.setItem(hashedKey, encryptedJson)

	const encoder = createSymmetricEncoder({ contentTopic, symKey, sigPrivKey })
	return await ws.setDoc<T>(encoder, doc)
}

export default class WakuAdapter implements Adapter {
	private safeWaku = new SafeWaku()
	private subscriptions: Array<() => void> = []

	async onLogIn(wallet: BaseWallet): Promise<void> {
		const address = wallet.address

		const ownPrivateKey = wallet.privateKey
		const ownPublicKey = wallet.signingKey.compressedPublicKey

		const ownPublicEncryptionKey = hexToBytes(hash(ownPublicKey))
		const ownPrivateEncryptionKey = hexToBytes(hash(ownPrivateKey))

		const ws = await this.makeWakustore()
		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		const storageProfile = await getDoc<StorageProfile>(ws, 'profile', ownPublicEncryptionKey)
		profile.update((state) => ({
			...state,
			...storageProfile,
			address: ownPublicKey,
			loading: false,
		}))

		const storageChatEntries = await getDoc<StorageChatEntry[]>(
			ws,
			'chats',
			ownPrivateEncryptionKey,
		)
		chats.update((state) => ({ ...state, chats: new Map(storageChatEntries), loading: false }))

		// subscribe to invites
		const decoder = createSymmetricDecoder({
			contentTopic: 'invites',
			symKey: ownPublicEncryptionKey,
		})
		await this.safeWaku.subscribeEncrypted(
			ownPublicKey,
			decoder,
			async (message, decodedMessage) => {
				console.debug('invite', { message, decodedMessage })

				if (!this.checkMessageSignature(message, decodedMessage)) {
					return
				}

				if (message.type !== 'invite') {
					return
				}

				const chatEncryptionKey = getSharedSecret(ownPrivateKey, message.senderPublicKey)

				const chatsMap = get(chats).chats
				if (!chatsMap.has(chatEncryptionKey)) {
					let user = await this.storageProfileToUser(message.senderPublicKey)
					if (!user) {
						user = {
							publicKey: message.senderPublicKey,
						}
					}

					createPrivateChat(chatEncryptionKey, user, ownPublicKey)
				}
				await this.subscribeToPrivateChat(ownPublicKey, chatEncryptionKey, wakuObjectAdapter)
			},
		)

		// subscribe to chats
		const allChats = Array.from(get(chats).chats)
		for (const [, chat] of allChats) {
			await this.subscribeToChat(chat, ownPublicKey, wakuObjectAdapter)
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
				await this.saveChatStore(ownPrivateEncryptionKey)
			}, 1000)
		})
		this.subscriptions.push(subscribeChatStore)

		// object store
		const storageObjects = await getDoc<StorageObjectEntry[]>(
			ws,
			'objects',
			ownPrivateEncryptionKey,
		)
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
			await setDoc<StorageObjectEntry[]>(
				ws,
				'objects',
				ownPrivateEncryptionKey,
				hexToBytes(ownPrivateKey),
				Array.from(objects.objects),
			)
		})
		this.subscriptions.push(subscribeObjectStore)

		// installed objects
		const storageInstalledObjects = await getDoc<StorageInstalledObjectEntry[]>(
			ws,
			'installed',
			ownPrivateEncryptionKey,
		)
		installedObjectStore.update((state) => ({
			...state,
			objects: new Map(storageInstalledObjects),
			loading: false,
		}))

		let firstInstalledObjectStoreSave = true
		const subscribeInstalledObjectStore = installedObjectStore.subscribe(async (installed) => {
			if (firstInstalledObjectStoreSave) {
				firstInstalledObjectStoreSave = false
				return
			}
			await setDoc<StorageInstalledObjectEntry[]>(
				ws,
				'installed',
				ownPrivateEncryptionKey,
				hexToBytes(ownPrivateKey),
				Array.from(installed.objects),
			)
		})
		this.subscriptions.push(subscribeInstalledObjectStore)

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

	async saveUserProfile(wallet: BaseWallet, name?: string, avatar?: string): Promise<void> {
		const ownPublicKey = wallet.signingKey.compressedPublicKey
		const ownPublicEncryptionKey = hexToBytes(hash(ownPublicKey))
		const ownPrivateKey = wallet.privateKey

		const defaultProfile: StorageProfile = { name: name ?? ownPublicKey }
		const storageProfile = (await this.fetchStorageProfile(ownPublicKey)) || defaultProfile

		if (avatar) storageProfile.avatar = avatar
		if (name) storageProfile.name = name

		if (avatar || name) {
			const ws = await this.makeWakustore()
			setDoc<StorageProfile>(
				ws,
				'profile',
				ownPublicEncryptionKey,
				hexToBytes(ownPrivateKey),
				storageProfile,
			)
			profile.update((state) => ({ ...state, name, avatar }))
		}
	}

	async getUserProfile(address: string): Promise<User | undefined> {
		return this.storageProfileToUser(address)
	}

	async startChat(wallet: BaseWallet, peerPublicKey: string): Promise<string> {
		const storageProfile = await this.fetchStorageProfile(peerPublicKey)
		if (!storageProfile) {
			throw 'User not found!'
		}

		const ownPrivateKey = wallet.privateKey
		const ownPublicKey = wallet.signingKey.compressedPublicKey

		// send invite
		const inviteMessage: InviteMessage = {
			type: 'invite',
			timestamp: Date.now(),
			senderPublicKey: wallet.signingKey.compressedPublicKey,
			chatId: ownPublicKey,
		}

		const inviteEncryptionKey = hexToBytes(hash(peerPublicKey))
		const ws = await this.makeWakustore()
		const encoder = createSymmetricEncoder({
			contentTopic: 'invites',
			symKey: inviteEncryptionKey,
			sigPrivKey: ownPrivateKey,
		})
		await ws.setDoc(encoder, inviteMessage)

		const chatEncryptionKey = getSharedSecret(ownPrivateKey, peerPublicKey)
		const joined = true
		const user = {
			publicKey: peerPublicKey,
			name: storageProfile.name,
			avatar: storageProfile.avatar,
		}
		createPrivateChat(chatEncryptionKey, user, ownPublicKey, joined)

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)
		await this.subscribeToPrivateChat(ownPublicKey, chatEncryptionKey, wakuObjectAdapter)

		return chatEncryptionKey
	}

	async startGroupChat(
		wallet: BaseWallet,
		chatId: string,
		memberPublicKeys: string[],
		name: string,
		avatar?: string,
	): Promise<string> {
		if (memberPublicKeys.length === 0) {
			throw 'invalid chat'
		}

		const userAddresses = [...memberPublicKeys, wallet.signingKey.compressedPublicKey]
		const storageChat = {
			users: userAddresses,
			name,
			avatar,
		}
		const chat = await this.storageChatToChat(chatId, storageChat)
		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		createGroupChat(chatId, chat.users, name, avatar, true)

		const ws = await this.makeWakustore()
		const encryptionKey = hexToBytes(chatId)
		const privateKey = hexToBytes(wallet.privateKey)
		const encoder = createSymmetricEncoder({
			contentTopic: 'group-chats',
			symKey: encryptionKey,
			sigPrivKey: privateKey,
		})
		await ws.setDoc<StorageChat>(encoder, storageChat)

		const ownPublicKey = wallet.signingKey.compressedPublicKey
		await this.subscribeToGroupChat(ownPublicKey, chatId, wakuObjectAdapter)

		return chatId
	}

	async addMemberToGroupChat(chatId: string, users: string[]): Promise<void> {
		const ws = await this.makeWakustore()
		const encryptionKey = hexToBytes(chatId)
		const decoder = createSymmetricDecoder({ contentTopic: 'group-chats', symKey: encryptionKey })

		const groupChat = await ws.getDoc<StorageChat>(decoder)
		if (!groupChat) {
			return
		}

		const newUsers = groupChat.users.concat(...users)
		const uniqueUsers = Array.from(new Set(newUsers))

		groupChat.users = uniqueUsers

		const wallet = get(walletStore).wallet
		if (!wallet) {
			return
		}

		const privateKey = hexToBytes(wallet.privateKey)
		const encoder = createSymmetricEncoder({
			contentTopic: 'group-chats',
			symKey: encryptionKey,
			sigPrivKey: privateKey,
		})
		await ws.setDoc<StorageChat>(encoder, groupChat)
	}

	async removeFromGroupChat(chatId: string, address: string): Promise<void> {
		const ws = await this.makeWakustore()
		const encryptionKey = hexToBytes(chatId)

		const decoder = createSymmetricDecoder({ contentTopic: 'group-chats', symKey: encryptionKey })
		const groupChat = await ws.getDoc<StorageChat>(decoder)
		if (!groupChat) {
			return
		}
		const updatedGroupChat = {
			...groupChat,
			users: groupChat.users.filter((user) => user !== address),
		}

		const wallet = get(walletStore).wallet
		if (!wallet) {
			return
		}

		const privateKey = hexToBytes(wallet.privateKey)
		const encoder = createSymmetricEncoder({
			contentTopic: 'group-chats',
			symKey: encryptionKey,
			sigPrivKey: privateKey,
		})
		await ws.setDoc<StorageChat>(encoder, updatedGroupChat)
	}

	async saveGroupChatProfile(chatId: string, name?: string, avatar?: string): Promise<void> {
		const ws = await this.makeWakustore()
		const encryptionKey = hexToBytes(chatId)

		const decoder = createSymmetricDecoder({ contentTopic: 'group-chats', symKey: encryptionKey })
		const groupChat = await ws.getDoc<StorageChat>(decoder)
		if (!groupChat) {
			return
		}

		groupChat.name = name ?? groupChat.name
		groupChat.avatar = avatar ?? groupChat.avatar

		const wallet = get(walletStore).wallet
		if (!wallet) {
			return
		}

		const privateKey = hexToBytes(wallet.privateKey)
		const encoder = createSymmetricEncoder({
			contentTopic: 'group-chats',
			symKey: encryptionKey,
			sigPrivKey: privateKey,
		})
		await ws.setDoc<StorageChat>(encoder, groupChat)
	}

	async sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void> {
		const senderPublicKey = wallet.signingKey.compressedPublicKey
		const senderPrivateKey = wallet.privateKey
		const message: Message = {
			type: 'user',
			timestamp: Date.now(),
			text,
			senderPublicKey,
		}

		const encryptionKey = hexToBytes(chatId)

		await this.safeWaku.sendMessage(message, encryptionKey, hexToBytes(senderPrivateKey))
	}

	async sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: JSONSerializable,
	): Promise<void> {
		const senderPublicKey = wallet.signingKey.compressedPublicKey
		const senderPrivateKey = wallet.privateKey
		const message: Message = {
			type: 'data',
			timestamp: Date.now(),
			senderPublicKey,
			objectId,
			instanceId,
			data,
		}

		const encryptionKey = hexToBytes(chatId)

		await this.safeWaku.sendMessage(message, encryptionKey, hexToBytes(senderPrivateKey))
	}

	async sendGroupChatInvite(
		wallet: BaseWallet,
		chatId: string,
		userPublicKeys: string[],
	): Promise<void> {
		const senderPublicKey = wallet.signingKey.compressedPublicKey
		const message: Message = {
			type: 'invite',
			timestamp: Date.now(),
			senderPublicKey,
			chatId,
		}

		const ownPrivateKey = wallet.privateKey
		const sigPrivKey = hexToBytes(ownPrivateKey)
		for (const userPublicKey of userPublicKeys) {
			const chatEncryptionKey = hexToBytes(getSharedSecret(ownPrivateKey, userPublicKey))

			await this.safeWaku.sendMessage(message, chatEncryptionKey, sigPrivKey)
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
		const uniqueUsers = Array.from(new Set(storageChat.users))
		const userPromises = uniqueUsers.map((user) => this.storageProfileToUser(user))
		const allUsers = await Promise.all(userPromises)
		const users = allUsers.filter((user) => user) as User[]

		return {
			chatId,
			type: 'group',
			messages: [],
			unread: 0,
			users,
			name: storageChat.name,
			avatar: storageChat.avatar,
		}
	}

	// fetches the profile from the network
	private async fetchStorageProfile(profilePublicKey: string): Promise<StorageProfile | undefined> {
		const ws = await this.makeWakustore()
		const profileEncryptionKey = hexToBytes(hash(profilePublicKey))
		const decoder = createSymmetricDecoder({
			contentTopic: 'profile',
			symKey: profileEncryptionKey,
		})
		const decodedMessage = await ws.getDecodedMessage(decoder)

		if (!decodedMessage) {
			console.error('missing document')
			return
		}

		if (!decodedMessage.signaturePublicKey) {
			console.error('missing signature', { decodedMessage })
			return
		}

		if (compressPublicKey(decodedMessage.signaturePublicKey) !== fixHex(profilePublicKey)) {
			console.error('invalid signature', {
				decodedMessage,
				profilePublicKey,
				signaturePublicKey: bytesToHex(decodedMessage.signaturePublicKey),
			})
			return
		}

		const storageProfile = await ws.decodeDoc<StorageProfile>(decodedMessage)

		console.debug({ storageProfile, profilePublicKey, decoder })

		return storageProfile
	}

	// optimised version that first checks if the user is a contact
	// then fetches from the network if not
	private async storageProfileToUser(profilePublicKey: string): Promise<User | undefined> {
		const contactUser = Array.from(get(chats).chats)
			.flatMap(([, chat]) => chat.users)
			.find((user) => user.publicKey === profilePublicKey)

		if (contactUser) {
			return contactUser
		}

		const storageProfile = await this.fetchStorageProfile(profilePublicKey)
		if (!storageProfile) {
			return
		}

		const user = {
			name: storageProfile.name,
			avatar: storageProfile.avatar,
			publicKey: profilePublicKey,
		}

		return user
	}

	private async subscribeToChat(
		chat: Chat,
		ownPublicKey: string,
		wakuObjectAdapter: WakuObjectAdapter,
	) {
		const lastSeenMessageTime = getLastMessageTime(chat)
		const now = new Date()
		const timeFilter = {
			startTime: new Date(lastSeenMessageTime + 1),
			endTime: now,
		}

		if (isGroupChat(chat)) {
			await this.subscribeToGroupChat(ownPublicKey, chat.chatId, wakuObjectAdapter, timeFilter)
		} else {
			await this.subscribeToPrivateChat(ownPublicKey, chat.chatId, wakuObjectAdapter, timeFilter)
		}
	}

	private async subscribeToGroupChat(
		ownPublicKey: string,
		groupChatId: string,
		wakuObjectAdapter: WakuObjectAdapter,
		timeFilter?: TimeFilter,
	) {
		const ws = await this.makeWakustore()

		const groupEncryptionKey = hexToBytes(groupChatId)
		const decoder = createSymmetricDecoder({
			contentTopic: 'group-chats',
			symKey: groupEncryptionKey,
		})
		const groupChat = await ws.getDoc<StorageChat>(decoder)
		console.debug({ groupChat, groupChatId })
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
			ws.docQuery(decoder),
			async (groupChat, decodedMessage) => {
				// check if signed
				if (!decodedMessage.signaturePublicKey) {
					return
				}

				// check if the chat exists locally
				const chat = get(chats).chats.get(groupChatId)
				if (!chat) {
					return
				}

				// check if the signature matches a member of the group
				if (
					!chat.users
						.map((user) => user.publicKey)
						.includes(bytesToHex(decodedMessage.signaturePublicKey))
				) {
					return
				}

				if (groupChat.users.includes(ownPublicKey)) {
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

		await this.subscribeToPrivateChat(ownPublicKey, groupChatId, wakuObjectAdapter, timeFilter)
	}

	private async subscribeToPrivateChat(
		ownPublicKey: string,
		chatId: string,
		wakuObjectAdapter: WakuObjectAdapter,
		timeFilter?: TimeFilter,
	) {
		const encryptionKey = hexToBytes(chatId)
		const decoder = createSymmetricDecoder({
			contentTopic: 'private-message',
			symKey: encryptionKey,
		})

		this.safeWaku.subscribeEncrypted(
			chatId,
			decoder,
			async (message, decodedMessage) => {
				if (!this.checkMessageSignature(message, decodedMessage)) {
					return
				}
				await this.handleMessage(ownPublicKey, message, encryptionKey, wakuObjectAdapter)
			},
			timeFilter,
		)
	}

	private async handleMessage(
		ownPublicKey: string,
		message: Message,
		encryptionKey: Uint8Array,
		adapter: WakuObjectAdapter,
	) {
		const chatId = bytesToHex(encryptionKey)
		const chatsMap = get(chats).chats

		// create group chat when invited
		if (message.type === 'invite') {
			const chat = chatsMap.get(chatId)
			if (!chat || isGroupChat(chat)) {
				return
			}

			// already invited
			if (chatsMap.has(message.chatId)) {
				return
			}

			createGroupChat(message.chatId, [], undefined, undefined, undefined, message.senderPublicKey)
			// add the message to the private chat of the inviter
			await addMessageToChat(ownPublicKey, adapter, message.senderPublicKey, message)
			await this.subscribeToGroupChat(ownPublicKey, message.chatId, adapter)

			return
		}

		// create chat if does not exist yet
		if (!chatsMap.has(chatId)) {
			const user = await this.storageProfileToUser(message.senderPublicKey)
			if (!user) {
				return
			}

			createPrivateChat(chatId, user, ownPublicKey)
		}

		let send: undefined | ((data: JSONValue) => Promise<void>) = undefined

		if (message.type === 'data') {
			// FIXME: @agazso figure out how to get wallet here without using the store
			const wallet = get(walletStore).wallet
			if (wallet) {
				const { instanceId, objectId } = message
				send = (data: JSONValue) => this.sendData(wallet, chatId, objectId, instanceId, data)
			}
		}

		await addMessageToChat(ownPublicKey, adapter, chatId, message, send)
	}

	private checkMessageSignature(message: Message, decodedMessage: DecodedMessage): boolean {
		if (!decodedMessage.signaturePublicKey) {
			console.debug('missing signature')
			return false
		}

		if (compressPublicKey(decodedMessage.signaturePublicKey) !== fixHex(message.senderPublicKey)) {
			console.error('invalid signature', { decodedMessage, message })
			return false
		}

		return true
	}

	private async updateContactProfiles() {
		// look for changes in users profile name and picture
		const allContacts = Array.from(get(chats).chats).flatMap(([, chat]) => chat.users)
		const uniqueContacts = new Map<string, User>(allContacts.map((user) => [user.publicKey, user]))
		const changes = new Map<string, User>()
		for (const contact of uniqueContacts) {
			const user = contact[1]
			const storageProfile = await this.fetchStorageProfile(user.publicKey)

			if (!storageProfile) {
				continue
			}

			if (storageProfile.name != user.name || storageProfile.avatar != user.avatar) {
				changes.set(user.publicKey, { ...storageProfile, publicKey: user.publicKey })
			}
		}
		if (changes.size > 0) {
			chats.update((state) => {
				const newChats = new Map<string, Chat>(state.chats)
				newChats.forEach((chat) => {
					chat.users.forEach((user) => {
						const changedUser = changes.get(user.publicKey)
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

	private async saveChatStore(ownPrivateEncryptionKey: Uint8Array) {
		const ws = await this.makeWakustore()
		const chatData: ChatData = get(chats)

		const wallet = get(walletStore).wallet
		if (!wallet) {
			return
		}

		const sigPrivKey = hexToBytes(wallet.privateKey)
		const result = await setDoc<StorageChatEntry[]>(
			ws,
			'chats',
			ownPrivateEncryptionKey,
			sigPrivKey,
			Array.from(chatData.chats),
		)

		return result
	}
}
