import { profile, type Profile } from '$lib/stores/profile'
import type { Adapter } from '..'
import { chats, type DraftChat, type Chat, type Message, type ChatData } from '$lib/stores/chat'
import { contacts, type ContactData, type User } from '$lib/stores/users'
import type { LightNode } from '@waku/interfaces'
import {
	connectWaku,
	decodeMessagePayload,
	parseQueryResults,
	privateMessageTopic,
	readLatestDocument,
	readStore,
	sendMessage,
	storeDocument,
	subscribe,
} from './waku'
import type { DecodedMessage } from '@waku/core'
import type { HDNodeWallet } from 'ethers'
import { ipfs, IPFS_GATEWAY } from '../firebase/connections'

function addMessageToChat(chatId: string, message: Message) {
	console.debug({ chatId, message })
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

	async onLogIn(wallet: HDNodeWallet): Promise<void> {
		const address = wallet.address
		this.waku = await connectWaku()

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

		const chatData = (await readLatestDocument(this.waku, 'chats', address)) as ChatData
		chats.update((state) => ({ ...state, ...chatData, loading: false }))

		const subscribeChats = await subscribe(
			this.waku,
			'private-message',
			address,
			(msg: DecodedMessage) => {
				const decodedPayload = decodeMessagePayload(msg)
				const chatMessage = JSON.parse(decodedPayload) as Message
				addMessageToChat(chatMessage.fromAddress, chatMessage)
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

	async startChat(wallet: HDNodeWallet, chat: DraftChat): Promise<string> {
		if (!this.waku) {
			throw 'no waku'
		}

		const address = wallet.address
		console.debug({ address, chat })

		if (chat.users.length !== 2) {
			throw 'invalid chat'
		}
		const chatId = chat.users[0]
		const user = await lookupUserFromContacts(this.waku, chatId)
		if (!user) {
			throw 'invalid user'
		}

		console.debug({ chatId, chat })

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
		if (!this.waku) {
			throw 'no waku'
		}

		const fromAddress = wallet.address
		const message: Message = {
			timestamp: Date.now(),
			text,
			fromAddress,
		}

		addMessageToChat(chatId, message)
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
}
