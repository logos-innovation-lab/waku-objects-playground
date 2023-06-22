import type { DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'

export interface WakuObjectArgs {
	readonly address: string
	readonly name: string

	readonly store: unknown
	updateStore: (updater: (state: unknown) => unknown) => void

	send: (data: unknown) => Promise<void>
}

interface WakuObjectDescriptor {
	readonly objectId: string
	readonly wakuObject: ComponentType
	onMessage?: (address: string, store: unknown, message: DataMessage) => unknown
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}
