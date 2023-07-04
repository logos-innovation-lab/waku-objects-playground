import { writable, type Writable } from 'svelte/store'
import type { User } from './users'

export interface UserMessage {
	type: 'user'
	timestamp: number
	fromAddress: string
	text: string
}

export interface DataMessage<T = unknown> {
	type: 'data'
	timestamp: number
	fromAddress: string
	objectId: string
	instanceId: string
	data?: T
}

export type Message = UserMessage | DataMessage

export interface DraftChat {
	messages: Message[]
	users: string[]
	name?: string
}

export interface Chat {
	chatId: string
	messages: Message[]
	users: User[]
	name?: string
}

export interface ChatData {
	loading: boolean
	chats: Map<string, Chat>
	error?: Error
}

type ChatStore = Writable<ChatData>

function createChatStore(): ChatStore {
	const store = writable<ChatData>({ loading: true, chats: new Map<string, Chat>() })

	return store
}

export const chats = createChatStore()
