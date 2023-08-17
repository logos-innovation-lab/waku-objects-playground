import type { Chat } from '$lib/stores/chat'
import type { ObjectState } from '$lib/stores/objects'

export interface StorageChat {
	users: string[]
	name: string
	avatar?: string
}

export interface StorageProfile {
	name: string
	avatar?: string
}

export type StorageChatEntry = [chatId: string, chat: Chat]

export type StorageObjects = ObjectState
