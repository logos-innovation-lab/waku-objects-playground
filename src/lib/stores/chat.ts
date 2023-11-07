import type { JSONSerializable } from '$lib/objects'
import type { User } from '$lib/types'
import { writable, type Writable } from 'svelte/store'

export interface UserMessage {
	type: 'user'
	timestamp: number
	senderPublicKey: string
	text: string
}

export interface DataMessage<T extends JSONSerializable = JSONSerializable> {
	type: 'data'
	timestamp: number
	senderPublicKey: string
	objectId: string
	instanceId: string
	data: T
}

export interface InviteMessage {
	type: 'invite'
	timestamp: number
	senderPublicKey: string
	chatId: string
}

export type Message = UserMessage | DataMessage | InviteMessage

export type ChatType = 'private' | 'group'

export interface Chat {
	chatId: string
	type: ChatType
	messages: Message[]
	unread: number
	users: User[]
	name?: string
	avatar?: string
	joined?: boolean
	inviter?: string
}

export interface ChatData {
	loading: boolean
	chats: Map<string, Chat>
	error?: Error
}

interface ChatStore extends Writable<ChatData> {
	createChat: (chat: Chat) => void
	updateChat: (chatId: string, update: (chat: Chat) => Chat) => void
	removeChat: (chatId: string) => void
}

export function isGroupChat(chat: Chat) {
	return chat.type === 'group'
}

export function getLastMessageTime(chat?: Chat) {
	const lastMessage = chat?.messages.slice(-1)[0]
	return lastMessage ? lastMessage.timestamp : 0
}

function createChatStore(): ChatStore {
	const store = writable<ChatData>({
		loading: true,
		chats: new Map<string, Chat>(),
	})

	return {
		...store,
		createChat: (chat: Chat) => {
			store.update((state) => {
				if (state.chats.has(chat.chatId)) {
					return state
				}

				state.chats.set(chat.chatId, chat)

				return {
					...state,
					chats: state.chats,
					loading: false,
				}
			})
		},
		updateChat: (chatId: string, update: (chat: Chat) => Chat) => {
			store.update((state) => {
				if (!state.chats.has(chatId)) {
					return state
				}
				const oldChat = state.chats.get(chatId)
				if (!oldChat) {
					return state
				}
				const newMap = new Map(state.chats)
				const newChat = update(oldChat)
				newMap.set(chatId, newChat)

				return {
					...state,
					chats: newMap,
				}
			})
		},
		removeChat: (chatId: string) => {
			store.update((state) => {
				if (!state.chats.has(chatId)) {
					return state
				}
				state.chats.delete(chatId)

				return {
					...state,
					chats: state.chats,
				}
			})
		},
	}
}

export const chats = createChatStore()
