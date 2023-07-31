import type { User } from '$lib/types'
import { writable, type Writable } from 'svelte/store'

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
	avatar?: string
}

export interface Chat {
	chatId: string
	messages: Message[]
	unread: number
	users: User[]
	name?: string
	avatar?: string
}

export interface ChatData {
	loading: boolean
	chats: Map<string, Chat>
	groups: Map<string, Chat>
	error?: Error
}

type ChatStore = Writable<ChatData>

function createChatStore(): ChatStore {
	const store = writable<ChatData>({
		loading: true,
		chats: new Map<string, Chat>(),
		groups: new Map<string, Chat>(),
	})

	return store
}

export const chats = createChatStore()
