import { profile, type Profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import { chats, type DraftChat, type Chat, type Message } from '$lib/stores/chat'
import { get } from 'svelte/store'
import { contacts, type ContactData, type User } from '$lib/stores/users'
import type { LightNode } from "@waku/interfaces"
import { connectWaku, decodeMessagePayload, privateMessageTopic, readLatestDocument, sendMessage, storeDocument, subscribe } from './waku'
import Base from '../base'

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

async function lookupUserFromContacts(waku: LightNode, address: string): Promise<User | undefined> {
	const contactsData = await readLatestDocument(waku, 'contacts', address) as ContactData
	return contactsData.contacts.get(address)
}

export default class WakuAdapter extends Base implements Adapter {
	private waku: LightNode | undefined

	start() {
		super.start()

		const unsubscribeUser = profile.subscribe(async (p) => {
			if (this.waku && this.wallet && p.address && this.userSubscriptions.length === 0) {
				const address = this.wallet.address

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

	async restoreWallet(mnemonic: string): Promise<void> {
		await super.restoreWallet(mnemonic)

		if (!this.wallet) {
			console.error('No wallet found')
			return
		}

		const address = this.wallet.address
		this.waku = await connectWaku()

		const profileData = await readLatestDocument(this.waku, 'profile', address) as Profile
		const name = profileData?.name
		profile.update((state) => ({ ...state, address, name, loading: false}))	

		const contactsData = await readLatestDocument(this.waku, 'contacts', address) as ContactData
		contacts.update(() => ({ ...contactsData }))
	}

	async saveUserProfile(name?: string, avatar?: string): Promise<void> {
		if (!this.wallet) {
			console.error('No wallet found')
			return
		}

		const address = this.wallet.address
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
		if (!this.wallet) {
			throw 'No wallet found'
		}
		if (!this.waku) {
			throw 'no waku'
		}

		const address = this.wallet.address

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
				users: [user, {address}]
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
}
