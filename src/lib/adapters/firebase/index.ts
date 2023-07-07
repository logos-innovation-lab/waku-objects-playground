import {
	doc,
	setDoc,
	collection,
	addDoc,
	onSnapshot,
	query,
	arrayUnion,
	where,
} from 'firebase/firestore'

// Stores
import {
	chats,
	type DraftChat,
	type Chat,
	type UserMessage,
	type DataMessage,
} from '$lib/stores/chat'
import { profile } from '$lib/stores/profile'
import { contacts, type User } from '$lib/stores/users'

import {
	ChatDbSchema,
	TokenDbSchema,
	UserDbSchema,
	type ProfileDb,
	type TokenDb,
	ObjectDbSchema,
} from './schemas'

import { formatAddress } from '$lib/utils/format'
import { db, ipfs, IPFS_GATEWAY } from './connections'

import type { BaseWallet } from 'ethers'
import type { Adapter } from '..'
import { balanceStore, type Token } from '$lib/stores/balances'
import { objectKey, objectStore } from '$lib/stores/objects'
import { lookup } from '$lib/objects/lookup'
import { type Unsubscriber, get } from 'svelte/store'
import { sleep } from '../utils'
import { getBalance, sendTransaction } from '../transaction'
import { makeWakuObjectAdapter } from '$lib/objects/adapter'

export default class FirebaseAdapter implements Adapter {
	protected userSubscriptions: Array<() => unknown> = []

	async onLogIn(wallet: BaseWallet) {
		profile.set({ loading: true })
		contacts.update((state) => ({ ...state, loading: true }))
		balanceStore.update((state) => ({ ...state, loading: true }))

		const { address } = wallet

		const wakuObjectAdapter = makeWakuObjectAdapter(this, wallet)

		const profileSnapshot = doc(db, `users/${address}`)
		const profileData: Partial<ProfileDb> = { address, lastSignIn: Date.now() }
		await setDoc(profileSnapshot, profileData, { merge: true })

		const subscribeProfile = onSnapshot(profileSnapshot, (res) => {
			const parseRes = UserDbSchema.safeParse(res.data())
			if (parseRes.success) {
				const user: User = parseRes.data
				profile.update((state) => ({ ...state, ...user, loading: false }))
			} else {
				console.error(parseRes.error.issues)
			}
		})
		this.userSubscriptions.push(subscribeProfile)

		const objectCollection = collection(db, `users/${address}/objects`)
		const subscribeObjects = onSnapshot(objectCollection, (res) => {
			const objects = new Map<string, unknown>()
			res.docs.forEach((d) => {
				const parseRes = ObjectDbSchema.safeParse(d.data())
				if (parseRes.success) {
					objects.set(d.id, parseRes.data)
				} else {
					console.error(parseRes.error.issues)
				}
			})
			objectStore.set({ objects, loading: false, lastUpdated: Date.now() })
		})
		this.userSubscriptions.push(subscribeObjects)

		const chatsSnapshot = query(collection(db, `chats`), where('users', 'array-contains', address))
		const subscribeChats = onSnapshot(chatsSnapshot, async (res) => {
			// Need to wait for contacts to be loaded before processing chats
			let unsubscribe: Unsubscriber | undefined
			const contactsPromise = new Promise<void>((resolve, reject) => {
				unsubscribe = contacts.subscribe((c) => {
					if (c.loading === false) {
						resolve()
					}
					if (c.error) {
						reject(c.error)
					}
				})
			})
			try {
				await contactsPromise
				await sleep(100) // This needs to be here as sometimes the contacts are not yet populated even though loading is false
				const cnts = get(contacts).contacts
				unsubscribe && unsubscribe()

				const newChats = new Map<string, Chat>()
				res.docs.forEach((d) => {
					const parseRes = ChatDbSchema.passthrough().safeParse(d.data())
					if (parseRes.success) {
						const users: User[] = []
						parseRes.data.users.forEach((a) => {
							const user = cnts.get(a)
							if (user) users.push(user)
							else console.error(`Could not find user with address ${a}`)
						})
						const chat: Chat = {
							messages: parseRes.data.messages,
							name: parseRes.data.name,
							users,
							chatId: d.id,
						}

						// If there are two participants, use the other user name/address as chat name
						if ((!chat.name || chat.name === '') && chat.users.length === 2) {
							const otherUser = chat.users.find((other) => other.address !== address)
							if (!otherUser) return

							chat.name = otherUser.name ?? formatAddress(otherUser.address)
						}

						// update the object store if there is an incoming data message
						parseRes.data.messages.forEach((message) => {
							console.debug('onSnapshot', { message })
							if (message.type === 'data') {
								const descriptor = lookup(message.objectId)
								const key = objectKey(message.objectId, message.instanceId)
								const wakuObjectStore = get(objectStore)

								if (
									descriptor &&
									descriptor.onMessage &&
									wakuObjectStore.lastUpdated < message.timestamp
								) {
									const objects = wakuObjectStore.objects
									const newStore = descriptor.onMessage(
										address,
										wakuObjectAdapter,
										objects.get(key),
										message,
									)

									const objectDb = doc(db, `users/${address}/objects/${key}`)
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									setDoc(objectDb, newStore as any, { merge: true })
								}
							}
						})

						newChats.set(d.id, chat)
					} else {
						console.error(parseRes.error.issues)
					}
				})
				chats.update((state) => ({ ...state, chats: newChats, loading: false }))
			} catch (error) {
				console.error('Error loading chats', error)
			}
		})
		this.userSubscriptions.push(subscribeChats)

		const contactsCollection = collection(db, `users`)
		const subscribeUsers = onSnapshot(contactsCollection, (res) => {
			const cnts = new Map<string, User>()
			res.docs.forEach((d) => {
				const parseRes = UserDbSchema.safeParse(d.data())
				if (parseRes.success) {
					const user: User = parseRes.data
					cnts.set(user.address, user)
				} else {
					console.error(parseRes.error.issues)
				}
			})
			contacts.set({ contacts: cnts, loading: false })
		})
		this.userSubscriptions.push(subscribeUsers)

		const balanceCollection = collection(db, `users/${address}/balances`)
		const subscribeBalances = onSnapshot(balanceCollection, (res) => {
			const balances: Token[] = []
			res.docs.forEach((d) => {
				const parseRes = TokenDbSchema.safeParse(d.data())
				if (parseRes.success) {
					const token: Token = parseRes.data
					balances.push(token)
				} else {
					console.error(parseRes.error.issues)
				}
			})
			// TODO: Handle this better, every new signed in user should have some balances set
			if (balances.length === 0) this.initializeBalances(address)
			balanceStore.set({ balances, loading: false })
		})
		this.userSubscriptions.push(subscribeBalances)
	}

	onLogOut() {
		this.userSubscriptions.forEach((s) => s())
		this.userSubscriptions = []
		profile.set({ loading: false })
		contacts.set({ contacts: new Map<string, User>(), loading: false })
		balanceStore.set({ loading: false, balances: [] })
	}

	async saveUserProfile(address: string, name?: string, avatar?: string): Promise<void> {
		const userDoc = doc(db, `users/${address}`)

		const data: Partial<ProfileDb> = { address }
		if (avatar) data.avatar = avatar
		if (name) data.name = name

		setDoc(userDoc, data, { merge: true })
		profile.update((state) => ({ ...state, ...data }))
	}

	async startChat(_address: string, chat: DraftChat): Promise<string> {
		const chatCollection = collection(db, `/chats`)
		const chatDoc = await addDoc(chatCollection, chat)

		return chatDoc.id
	}

	async sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void> {
		const fromAddress = wallet.address
		const message: UserMessage = {
			type: 'user',
			timestamp: Date.now(),
			fromAddress,
			text,
		}

		const chatDoc = doc(db, `chats/${chatId}`)
		setDoc(chatDoc, { messages: arrayUnion(message), lastMessage: text }, { merge: true })
	}

	async sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: unknown,
	): Promise<void> {
		const fromAddress = wallet.address
		const message: DataMessage = {
			type: 'data',
			timestamp: Date.now(),
			fromAddress,
			objectId,
			instanceId,
			data,
		}

		const chatDoc = doc(db, `chats/${chatId}`)
		setDoc(chatDoc, { messages: arrayUnion(message) }, { merge: true })
	}

	async uploadPicture(picture: string): Promise<string> {
		const blob = await (await fetch(picture)).blob()
		const res = await ipfs.add(blob)

		return res.cid.toString()
	}

	getPicture(cid: string): string {
		return `${IPFS_GATEWAY}/${cid}`
	}

	/**
	 * THIS IS JUST FOR DEV PURPOSES
	 */
	async initializeBalances(address: string): Promise<void> {
		const nativeTokenAmount = await getBalance(address)

		const ethDoc = doc(db, `users/${address}/balances/eth`)
		const ethData: Omit<TokenDb, 'amount'> & { amount: string } = {
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
			amount: nativeTokenAmount.toString(),
			image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
		}

		setDoc(ethDoc, ethData)

		const daiDoc = doc(db, `users/${address}/balances/dai`)
		const daiData: Omit<TokenDb, 'amount'> & { amount: string } = {
			name: 'Dai',
			symbol: 'DAI',
			decimals: 18,
			amount: 7843900000000000000000n.toString(),
			image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
			address: '0x0000000000000000000000000000000000000000',
		}

		setDoc(daiDoc, daiData)
	}

	async checkBalance(address: string, token: Token): Promise<void> {
		if (token.address) {
			// only native token is supported for now
			return
		}

		const nativeTokenAmount = await getBalance(address)

		const ethDoc = doc(db, `users/${address}/balances/${token.symbol.toLowerCase()}`)
		const ethData: { amount: string } = {
			amount: nativeTokenAmount.toString(),
		}

		setDoc(ethDoc, ethData, { merge: true })
	}

	async updateStore(
		address: string,
		objectId: string,
		instanceId: string,
		updater: (state: unknown) => unknown,
	): Promise<void> {
		const key = objectKey(objectId, instanceId)
		const objectDb = doc(db, `users/${address}/objects/${key}`)

		const wakuObjectStore = get(objectStore)

		const objects = wakuObjectStore.objects
		const newStore = updater(objects.get(key))

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		setDoc(objectDb, newStore as any, { merge: true })
	}

	async sendTransaction(wallet: BaseWallet, to: string, token: Token, fee: Token): Promise<string> {
		const { address } = wallet

		if (!address) throw new Error('Address is missing')

		const tx = await sendTransaction(wallet, to, token.amount, fee.amount)

		await this.checkBalance(wallet.address, token)

		const txCollection = collection(db, `transactions`)
		const txData = {
			from: address,
			to,
			token: {
				amount: token.amount.toString(),
				name: token.name,
				symbol: token.symbol,
				decimals: token.decimals,
			},
			timestamp: Date.now(),
			fee: {
				amount: fee.amount.toString(),
				symbol: fee.symbol,
				name: fee.name,
				decimals: fee.decimals,
			},
		}

		await addDoc(txCollection, txData)

		return tx.hash
	}

	estimateTransaction(): Promise<Token> {
		return Promise.resolve({
			name: 'Ether',
			symbol: 'ETH',
			amount: 123000000000000000n,
			decimals: 18,
		})
	}
}
