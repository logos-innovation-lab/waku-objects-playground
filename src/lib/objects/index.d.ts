import type { Token } from '$lib/stores/balances'
import type { DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'
import type { User } from './schemas'

export interface WakuObjectAdapter {
	checkBalance(token: Token): Promise<void>
	sendTransaction: (to: string, token: Token, fee: Token) => Promise<string>
	estimateTransaction: (to: string, token: Token) => Promise<Token>
}

export interface WakuObjectArgs<StoreType = unknown, DataMessageType extends object = unknown>
	extends WakuObjectAdapter {
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: Token[]

	readonly store: StoreType
	updateStore: (updater: (state: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	onViewChange?: (view: string) => void
}

type WakuStoreType = unknown

interface WakuObjectDescriptor {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string

	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
	onMessage?: (
		address: string,
		adapter: WakuObjectAdapter,
		store: WakuStoreType,
		message: DataMessage<DataMessageType>,
	) => WakuStoreType
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}
