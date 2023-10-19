import type { JSONSerializable } from '$lib/objects'
import type { Chat } from '$lib/stores/chat'

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

export type StorageObjectEntry = [objectId: string, object: JSONSerializable]

export interface StorageInstalledObject {
	objectId: string
	name: string
	description: string
	logo: string
}
export type StorageInstalledObjectEntry = [objectId: string, object: StorageInstalledObject]
