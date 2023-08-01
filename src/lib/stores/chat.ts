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

export interface InviteMessage {
	type: 'invite'
	timestamp: number
	fromAddress: string
	chatId: string
}

export type Message = UserMessage | DataMessage | InviteMessage

export interface DraftChat {
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
	error?: Error
}

type ChatStore = Writable<ChatData>

// FIXME temporary hack
export function isGroupChatId(id: string) {
	return id.length === 64
}

function createChatStore(): ChatStore {
	const store = writable<ChatData>({
		loading: true,
		chats: new Map<string, Chat>(),
	})

	return store
}

export const chats = createChatStore()
