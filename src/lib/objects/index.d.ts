import type { Token } from '$lib/stores/balances'
import type { DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'
import type { Transaction, User, TransactionState } from './schemas'
import type { Contract, Interface } from 'ethers'

export interface WakuObjectAdapter {
	getTransaction(txHash: string): Promise<Transaction | undefined>
	getTransactionState(txHash: string): Promise<TransactionState>
	waitForTransaction(txHash: string): Promise<TransactionState>
	checkBalance(token: Token): Promise<void>
	sendTransaction: (to: string, token: Token, fee: Token) => Promise<string>
	estimateTransaction: (to: string, token: Token) => Promise<Token>
	getContract(address: string, abi: Interface): Contract
}

type JSONSerializable =
	| string
	| number
	| boolean
	| null
	| JSONValue[]
	| { [key: string]: JSONValue }

export interface WakuObjectArgs<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
> extends WakuObjectAdapter {
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: Token[]

	readonly store: StoreType
	updateStore: (updater: (state: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	readonly view?: string
	onViewChange: (view: string) => void
}

interface WakuObjectDescriptor<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
> {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string

	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
	onMessage?: (
		address: string,
		adapter: WakuObjectAdapter,
		store: StoreType,
		updateStore: (updater: (state: StoreType) => StoreType) => void,
		message: DataMessage<DataMessageType>,
	) => Promise<void>
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}
