import { writable, type Writable } from 'svelte/store'
import type { User } from './users'

export interface Message {
	timestamp: number
	text: string
	fromAddress?: string
}

export interface DraftChat {
	messages: Message[]
	users: string[]
	name?: string
}

export interface Chat {
	chatId: string
	messages: Message[]
	users: User[]
	name: string
}

interface ChatData {
	loading: boolean
	chats: Map<string, Chat>
	error?: Error
}

export type ChatStore = Writable<ChatData>

function createChatStore(): ChatStore {
	const store = writable<ChatData>({ loading: true, chats: new Map<string, Chat>() })

	return store
}

export const chats = createChatStore()
