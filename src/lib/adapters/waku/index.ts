import { initializeApp } from 'firebase/app'
import {
	getFirestore,
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
import { create } from 'ipfs-http-client'
import {
	canConnectWallet,
	connectWallet,
	subscribeAccountChanged,
	subscribeChainChanged,
} from '../firebase/blockchain'
import { profile } from '$lib/stores/profile'
import type { Signer } from 'ethers'
import type { Adapter, Contact } from '..'
import { chats, type DraftChat, type Chat, type Message } from '$lib/stores/chat'
import { get } from 'svelte/store'
import { contacts, type User } from '$lib/stores/users'

const IPFS_AUTH =
	'Basic Mk5Nbk1vZUNSTWMyOTlCQjYzWm9QZzlQYTU3OjAwZTk2MmJjZTBkZmQxZWQxNGNhNmY1M2JiYjYxMTli'
const IPFS_GATEWAY = 'https://kurate.infura-ipfs.io/ipfs'

const firebaseConfig = {
	apiKey: 'AIzaSyCs8WujyoHcDqTFtG5b3R3HJVEyWmOCMpA',
	authDomain: 'waku-objects.firebaseapp.com',
	projectId: 'waku-objects',
	storageBucket: 'waku-objects.appspot.com',
	messagingSenderId: '824762862617',
	appId: '1:824762862617:web:4fe585c2d751a1d4586e88',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default class WakuAdapter implements Adapter {
	private signer: Signer | undefined
	private subscriptions: Array<() => unknown> = []
	private userSubscriptions: Array<() => unknown> = []
	private ipfs = create({
		host: 'ipfs.infura.io',
		port: 5001,
		protocol: 'https',
		headers: {
			authorization: IPFS_AUTH,
		},
	})

	start() {
		this.subscriptions.push(subscribeAccountChanged())
		this.subscriptions.push(subscribeChainChanged())

		const unsubscribeUser = profile.subscribe(async (p) => {
			if (p.address && this.userSubscriptions.length === 0) {
				const profileSnapshot = doc(db, `users/${p.address}`)
				const subscribeProfile = onSnapshot(profileSnapshot, (res) => {
					const { avatar, name } = res.data() as Contact // FIXME: Check this with ZOD
					profile.update((state) => ({ ...state, avatar, name, loading: false }))
				})
				this.userSubscriptions.push(subscribeProfile)

				const chatsSnapshot = query(
					collection(db, `chats`),
					where('users', 'array-contains', p.address),
				)
				const subscribeChats = onSnapshot(chatsSnapshot, (res) => {
					const newChats = new Map<string, Chat>()
					res.docs.forEach((d) => {
						const data = d.data() as Omit<Chat, 'chatId'> // FIXME: Check this with ZOD
						const chat = { ...data, chatId: d.id }
						newChats.set(d.id, chat)
					})
					chats.update((state) => ({ ...state, chats: newChats, loading: false }))
				})
				this.userSubscriptions.push(subscribeChats)

				// const contactsCollection = collection(db, `users/${p.address}/contacts`) // FIXME: revert to this
				const contactsCollection = collection(db, `users`)
				const subscribeUsers = onSnapshot(contactsCollection, (res) => {
					const cnts = new Map<string, User>()
					res.docs.forEach((d) => {
						const user = d.data() as User // FIXME: Check this with ZOD
						cnts.set(user.address, user)
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

	canLogIn(): boolean {
		return canConnectWallet()
	}

	async logIn(): Promise<void> {
		const signer = await connectWallet()
		this.signer = signer
		const address = await signer.getAddress()
		const userDoc = doc(db, `users/${address}`)

		await setDoc(userDoc, { address, lastSignIn: Date.now() }, { merge: true })
		const user = await getDoc(userDoc)

		// FIXME: type this properly
		const { name } = user.data() as { name: string }
		profile.update((state) => ({ ...state, address, name }))
	}
	logOut(): Promise<void> {
		this.signer = undefined
		profile.set({ loading: true })

		return Promise.resolve()
	}

	async getContact(address: string): Promise<Contact> {
		const contactDoc = doc(db, `users/${address}`)
		const contact = await getDoc(contactDoc)
		return contact.data() as Contact // FIXME: type this properly
	}

	async saveUserProfile(name?: string, avatar?: string): Promise<void> {
		const signer = await connectWallet()
		this.signer = signer
		const address = await signer.getAddress()
		const userDoc = doc(db, `users/${address}`)

		const data: Partial<Contact> = {}
		if (avatar) data.avatar = avatar
		if (name) data.name = name

		if (avatar || name) {
			setDoc(userDoc, { address, ...data }, { merge: true })
			profile.update((state) => ({ ...state, address, name, avatar }))
		}
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
		const res = await this.ipfs.add(blob)

		return res.cid.toString()
	}

	getPicture(cid: string): string {
		return `${IPFS_GATEWAY}/${cid}`
	}
}