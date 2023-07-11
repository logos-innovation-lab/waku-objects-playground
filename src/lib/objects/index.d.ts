import type { Token } from '$lib/stores/balances'
import type { DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'
import type { Transaction, User, TransactionState } from './schemas'

export interface WakuObjectAdapter {
	getTransaction(txHash: string): Promise<Transaction | undefined>
	getTransactionState(txHash: string): Promise<TransactionState>
	waitForTransaction(txHash: string): Promise<TransactionState>
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

	readonly view?: string
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
	readonly customArgs?: CustomArgs

	onMessage?: (
		address: string,
		adapter: WakuObjectAdapter,
		store: WakuStoreType,
		updateStore: (updater: (state: WakuStoreType) => WakuStoreType) => void,
		message: DataMessage<DataMessageType>,
	) => Promise<void>
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}
