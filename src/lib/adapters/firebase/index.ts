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

// Stores
import { chats, type DraftChat, type Chat, type Message } from '$lib/stores/chat'
import { profile } from '$lib/stores/profile'
import { contacts, type User } from '$lib/stores/users'

import { ChatDbSchema, UserDbSchema } from './schemas'

import { formatAddress } from '$lib/utils/format'
import { db, ipfs, IPFS_GATEWAY } from './connections'

import type { HDNodeWallet } from 'ethers'
import type { Unsubscriber } from 'svelte/store'
import type { Adapter, Contact } from '..'

export default class FirebaseAdapter implements Adapter {
	protected subscriptions: Array<() => unknown> = []
	protected userSubscriptions: Array<() => unknown> = []

	async onLogIn(wallet: HDNodeWallet) {
		console.log('called onLogIn')
		const address = await wallet.getAddress()
		const userDoc = doc(db, `users/${address}`)

		await setDoc(userDoc, { address, lastSignIn: Date.now() }, { merge: true })
		const user = await getDoc(userDoc)

		// FIXME: type this properly
		const { name } = user.data() as { name: string }
		profile.update((state) => ({ ...state, address, name, loading: false }))

		const profileSnapshot = doc(db, `users/${address}`)
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

		const chatsSnapshot = query(collection(db, `chats`), where('users', 'array-contains', address))
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
							const otherUser = chat.users.find((other) => other.address !== address)
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

	onLogOut() {
		this.userSubscriptions.forEach((s) => s())
		this.userSubscriptions = []
		profile.set({ loading: false })
		contacts.set({ contacts: new Map<string, User>(), loading: true })
	}

	async saveUserProfile(wallet: HDNodeWallet, name?: string, avatar?: string): Promise<void> {
		const address = await wallet.getAddress()
		if (!address) throw new Error('Not signed in')

		const userDoc = doc(db, `users/${address}`)

		const data: Partial<Contact> = { address }
		if (avatar) data.avatar = avatar
		if (name) data.name = name

		setDoc(userDoc, data, { merge: true })
		profile.update((state) => ({ ...state, ...data }))
	}

	async startChat(_wallet: HDNodeWallet, chat: DraftChat): Promise<string> {
		const chatCollection = collection(db, `/chats`)
		const chatDoc = await addDoc(chatCollection, chat)

		return chatDoc.id
	}

	async sendChatMessage(wallet: HDNodeWallet, chatId: string, text: string): Promise<void> {
		const fromAddress = await wallet.getAddress()

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
