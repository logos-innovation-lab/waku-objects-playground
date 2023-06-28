import type { Token } from '$lib/stores/balances'
import type { DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'

export interface WakuObjectArgs {
	readonly address: string
	readonly name: string

	readonly store: unknown
	updateStore: (updater: (state: unknown) => unknown) => void

	send: (data: unknown) => Promise<void>
	sendTransaction?: (to: string, token: Token, fee: Token) => Promise<string>
	estimateTransaction?: (to: string, token: Token) => Promise<Token>
	onViewChange?: (view: string) => void
}

interface WakuObjectDescriptor {
	readonly objectId: string
	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
	onMessage?: (address: string, store: unknown, message: DataMessage) => unknown
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}
