import { profile, type Profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import { chats, type DraftChat, type Chat, type Message, type ChatData } from '$lib/stores/chat'
import { contacts, type ContactData, type User } from '$lib/stores/users'
import type { LightNode } from '@waku/interfaces'
import {
	connectWaku,
	decodeMessagePayload,
	privateMessageTopic,
	readLatestDocument,
	sendMessage,
	storeDocument,
	subscribe,
} from './waku'
import type { DecodedMessage } from '@waku/core'
import type { HDNodeWallet } from 'ethers'
import { ipfs, IPFS_GATEWAY } from '../firebase/connections'

function addMessageToChat(message: Message) {
	chats.update((state) => {
		if (!state.chats.has(message.fromAddress)) {
			return state
		}

		const newChats = new Map<string, Chat>(state.chats)
		const chat = newChats.get(message.fromAddress)
		if (chat) {
			chat.messages = [...chat.messages]
		}

		return {
			...state,
			chats: newChats,
			loading: false,
		}
	})
}

async function lookupUserFromContacts(waku: LightNode, address: string): Promise<User | undefined> {
	const contactsData = (await readLatestDocument(waku, 'contact', address)) as ContactData
	return contactsData.contacts.get(address)
}

export default class WakuAdapter implements Adapter {
	private waku: LightNode | undefined
	private subscriptions: Array<() => void> = []

	async onLogIn(wallet: HDNodeWallet): Promise<void> {
		const address = wallet.address
		this.waku = await connectWaku()

		const profileData = (await readLatestDocument(this.waku, 'profile', address)) as Profile
		const name = profileData?.name
		console.debug({ profileData })
		profile.update((state) => ({ ...state, address, name, loading: false }))

		const contactsData = (await readLatestDocument(this.waku, 'contact', address)) as ContactData
		console.debug({ contactsData })

		contacts.update(() => ({
			contacts: contactsData?.contacts ?? new Map<string, User>(),
			loading: false,
		}))

		const chatData = (await readLatestDocument(this.waku, 'chats', address)) as ChatData
		chats.update((state) => ({ ...state, ...chatData, loading: false }))

		const subscribeChats = await subscribe(
			this.waku,
			'private-message',
			address,
			(msg: DecodedMessage) => {
				const decodedPayload = decodeMessagePayload(msg)
				const chatMessage = JSON.parse(decodedPayload) as Message
				addMessageToChat(chatMessage)
			},
		)
		this.subscriptions.push(subscribeChats)
	}

	async onLogOut() {
		this.subscriptions.forEach((s) => s())
		this.subscriptions = []
		profile.set({ loading: false })
		contacts.set({ contacts: new Map<string, User>(), loading: true })
	}

	async saveUserProfile(wallet: HDNodeWallet, name?: string, avatar?: string): Promise<void> {
		const address = wallet.address
		if (!this.waku) {
			return
		}
		const data = (await readLatestDocument(this.waku, 'profile', address)) as Profile

		if (avatar) data.avatar = avatar
		if (name) data.name = name

		if (avatar || name) {
			await storeDocument(this.waku, 'profile', address, data)
			profile.update((state) => ({ ...state, address, name, avatar }))
		}
	}

	async startChat(wallet: HDNodeWallet, chat: DraftChat): Promise<string> {
		if (!this.waku) {
			throw 'no waku'
		}

		const address = wallet.address

		if (chat.users.length !== 2) {
			throw 'invalid chat'
		}
		const chatId = chat.users[0]
		const user = await lookupUserFromContacts(this.waku, chatId)
		if (!user) {
			throw 'invalid user'
		}

		chats.update((state) => {
			if (state.chats.has(chatId)) {
				return state
			}

			const newChats = new Map<string, Chat>(state.chats)
			if (!user) {
				return state
			}
			const chat = {
				chatId: chatId,
				messages: [],
				users: [user, { address }],
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

	async sendChatMessage(wallet: HDNodeWallet, chatId: string, text: string): Promise<void> {
		const fromAddress = wallet.address

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
		const res = await ipfs.add(blob)

		return res.cid.toString()
	}

	getPicture(cid: string): string {
		return `${IPFS_GATEWAY}/${cid}`
	}
}
