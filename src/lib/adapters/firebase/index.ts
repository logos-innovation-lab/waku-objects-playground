import {
	doc,
	setDoc,
	collection,
	addDoc,
	onSnapshot,
	query,
	arrayUnion,
	where,
	getDoc,
} from 'firebase/firestore'
import { Wallet, HDNodeWallet } from 'ethers'
import type { Adapter, Contact } from '..'

// Stores
import { get, type Unsubscriber } from 'svelte/store'
import { chats, type DraftChat, type Chat, type Message } from '$lib/stores/chat'
import { profile } from '$lib/stores/profile'
import { contacts, type User } from '$lib/stores/users'

import { ChatDbSchema, UserDbSchema } from './schemas'
import { Mnemonic12Schema, type Mnemonic12 } from '$lib/utils/schemas'

import { formatAddress } from '$lib/utils/format'
import { getFromLocalStorage, removeFromLocalStorage, saveToLocalStorage } from '../utils'
import { db, ipfs, IPFS_GATEWAY } from './connections'

async function logIn(wallet: HDNodeWallet): Promise<void> {
	const address = await wallet.getAddress()
	const userDoc = doc(db, `users/${address}`)

	await setDoc(userDoc, { address, lastSignIn: Date.now() }, { merge: true })
	const user = await getDoc(userDoc)

	// FIXME: type this properly
	const { name } = user.data() as { name: string }
	profile.update((state) => ({ ...state, address, name, loading: false }))
}

export default class FirebaseAdapter implements Adapter {
	private wallet: HDNodeWallet | undefined
	private subscriptions: Array<() => unknown> = []
	private userSubscriptions: Array<() => unknown> = []

	start() {
		const mnemonic = getFromLocalStorage<Mnemonic12>('mnemonic', Mnemonic12Schema)
		if (mnemonic) {
			this.restoreWallet(mnemonic)
		} else {
			profile.update((state) => ({ ...state, loading: false }))
		}

		const unsubscribeUser = profile.subscribe(async (p) => {
			if (p.address && this.userSubscriptions.length === 0) {
				const profileSnapshot = doc(db, `users/${p.address}`)
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

				const chatsSnapshot = query(
					collection(db, `chats`),
					where('users', 'array-contains', p.address),
				)
				const subscribeChats = onSnapshot(chatsSnapshot, async (res) => {
					// Need to wait for contacts to be loaded before processing chats
					let unsubscribe: Unsubscriber | undefined
					const contactsPromise = new Promise<Map<string, User>>((resolve, reject) => {
						unsubscribe = contacts.subscribe((c) => {
							if (c.loading === false) {
								resolve(c.contacts)
							}
							if (c.error) {
								reject(c.error)
							}
						})
					})
					try {
						const cnts = await contactsPromise
						unsubscribe && unsubscribe()

						const newChats = new Map<string, Chat>()
						res.docs.forEach((d) => {
							const parseRes = ChatDbSchema.safeParse(d.data())

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
									const otherUser = chat.users.find((other) => other.address !== p.address)
									if (!otherUser) return

									chat.name = otherUser.name ?? formatAddress(otherUser.address)
								}

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

				// const contactsCollection = collection(db, `users/${p.address}/contacts`) // FIXME: revert to this
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
			}

			if (!p.address && this.userSubscriptions.length !== 0) {
				this.userSubscriptions.forEach((s) => s())
				this.userSubscriptions = []
				contacts.set({ contacts: new Map<string, User>(), loading: true })
			}
		})
		this.subscriptions.push(unsubscribeUser)
	}

	stop() {
		this.subscriptions.forEach((s) => s())
		this.userSubscriptions.forEach((s) => s())
	}

	async createWallet(): Promise<void> {
		this.wallet = Wallet.createRandom()

		const phrase = this.wallet.mnemonic?.phrase
		if (!phrase) {
			console.error('No mnemonic found in wallet')
			return
		}
		saveToLocalStorage('mnemonic', phrase)
	}

	restoreWallet(mnemonic: string): Promise<void> {
		// Create a new wallet from the mnemonic
		this.wallet = Wallet.fromPhrase(mnemonic)

		const phrase = this.wallet.mnemonic?.phrase
		if (!phrase) {
			console.error('No mnemonic found in wallet')
			return Promise.resolve()
		}
		saveToLocalStorage('mnemonic', phrase)

		return logIn(this.wallet)
	}
	disconnectWallet(): Promise<void> {
		this.wallet = undefined
		removeFromLocalStorage('mnemonic')

		return Promise.resolve()
	}

	hasWallet() {
		return (
			Boolean(this.wallet) || getFromLocalStorage<Mnemonic12>('mnemonic', Mnemonic12Schema) !== null
		)
	}

	getMnemonics(): string {
		const phrase = this.wallet?.mnemonic?.phrase
		if (!phrase) {
			throw 'No mnemonic found in wallet'
		}
		return phrase
	}

	async getContact(address: string): Promise<Contact> {
		const contactDoc = doc(db, `users/${address}`)
		const contact = await getDoc(contactDoc)
		return contact.data() as Contact // FIXME: type this properly
	}

	async saveUserProfile(name?: string, avatar?: string): Promise<void> {
		const address = await this.wallet?.getAddress()
		if (!address) throw new Error('Not signed in')

		const userDoc = doc(db, `users/${address}`)

		const data: Partial<Contact> = {}
		if (avatar) data.avatar = avatar
		if (name) data.name = name

		setDoc(userDoc, { address, ...data }, { merge: true })
		profile.update((state) => ({ ...state, address, name, avatar }))
	}

	async startChat(chat: DraftChat): Promise<string> {
		const chatCollection = collection(db, `/chats`)
		const chatDoc = await addDoc(chatCollection, chat)

		return chatDoc.id
	}

	async sendChatMessage(chatId: string, text: string): Promise<void> {
		const fromAddress = get(profile).address

		if (!fromAddress) throw new Error('ChatId or address is missing')

		const message: Message = {
			timestamp: Date.now(),
			text,
			fromAddress,
		}

		const chatDoc = doc(db, `chats/${chatId}`)
		setDoc(chatDoc, { messages: arrayUnion(message), lastMessage: text }, { merge: true })
	}

	async uploadPicture(picture: string): Promise<string> {
		const blob = await (await fetch(picture)).blob()
		const res = await ipfs.add(blob)

		return res.cid.toString()
	}

	getPicture(cid: string): string {
		return `${IPFS_GATEWAY}/${cid}`
	}
}
