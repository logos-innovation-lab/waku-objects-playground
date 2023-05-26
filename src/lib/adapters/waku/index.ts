import { create } from 'ipfs-http-client'
import {
	canConnectWallet,
	connectWallet,
	subscribeAccountChanged,
	subscribeChainChanged,
} from '../firebase/blockchain'
import { profile, type Profile } from '$lib/stores/profile'
import type { Signer } from 'ethers'
import type { Adapter } from '..'
import { chats, type DraftChat, type Chat, type Message } from '$lib/stores/chat'
import { get } from 'svelte/store'
import { contacts, type ContactData } from '$lib/stores/users'
import type { LightNode } from "@waku/interfaces"
import { connectWaku, decodeMessagePayload, privateMessageTopic, readLatestDocument, sendMessage, storeDocument, subscribe } from './waku'

const IPFS_AUTH =
	'Basic Mk5Nbk1vZUNSTWMyOTlCQjYzWm9QZzlQYTU3OjAwZTk2MmJjZTBkZmQxZWQxNGNhNmY1M2JiYjYxMTli'
const IPFS_GATEWAY = 'https://kurate.infura-ipfs.io/ipfs'

function addMessageToChat(message: Message) {
	chats.update((state) => {
		if (!state.chats.has(message.fromAddress)) {
			return state
		}

		const newChats = new Map<string, Chat>(state.chats)
		const chat = newChats.get(message.fromAddress)
		if (chat) {
			chat.messages = [...chat.messages, ]
		}

		return {
			...state,
			chats: newChats,
			loading: false,
		}
	})
}

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
	private waku: LightNode | undefined

	start() {
		this.subscriptions.push(subscribeAccountChanged())
		this.subscriptions.push(subscribeChainChanged())

		const unsubscribeUser = profile.subscribe(async (p) => {
			if (this.waku && this.signer && p.address && this.userSubscriptions.length === 0) {
				const address = await this.signer.getAddress()

				const subscribeChats = await subscribe(this.waku, 'private-message', address , (msg) => {
					const decodedPayload = decodeMessagePayload(msg)
					const chatMessage = JSON.parse(decodedPayload) as Message
					addMessageToChat(chatMessage)
				})
				this.userSubscriptions.push(subscribeChats)
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
		this.waku = await connectWaku()

		const profileData = await readLatestDocument(this.waku, 'profile', address) as Profile
		if (profileData) {
			const { avatar, name } = profileData
			profile.update((state) => ({ ...state, avatar, name, loading: false}))	
		}

		const contactsData = await readLatestDocument(this.waku, 'contacts', address) as ContactData
		contacts.update(() => ({ ...contactsData }))
	}
	
	logOut(): Promise<void> {
		this.signer = undefined
		profile.set({ loading: true })

		return Promise.resolve()
	}

	async saveUserProfile(name?: string, avatar?: string): Promise<void> {
		const signer = await connectWallet()
		this.signer = signer
		const address = await signer.getAddress()
		if (!this.waku) {
			return
		}
		const data = await readLatestDocument(this.waku, 'profile', address) as Profile

		if (avatar) data.avatar = avatar
		if (name) data.name = name

		if (avatar || name) {
			await storeDocument(this.waku, 'profile', address, data)
			profile.update((state) => ({ ...state, address, name, avatar }))
		}
	}

	async startChat(chat: DraftChat): Promise<string> {
		const signer = await connectWallet()
		this.signer = signer
		const address = await signer.getAddress()

		if (chat.users.length !== 2) {
			throw 'invalid chat'
		}
		const chatId = chat.users[0]

		chats.update((state) => {
			if (state.chats.has(chatId)) {
				return state
			}

			const newChats = new Map<string, Chat>(state.chats)
			const chat = {
				chatId: chatId,
				messages: [],
				users: [chatId, address]
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

	async sendChatMessage(chatId: string, text: string): Promise<void> {
		const fromAddress = get(profile).address

		if (!fromAddress) throw new Error('ChatId or address is missing')

		const message: Message = {
			timestamp: Date.now(),
			text,
			fromAddress,
		}

		if (!this.waku) {
			throw 'no waku'
		}
		addMessageToChat(message)
		await sendMessage(this.waku, privateMessageTopic(chatId), message)
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
