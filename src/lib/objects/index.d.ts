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
	sendTransaction: (to: string, token: Token) => Promise<string>
	estimateTransaction: (to: string, token: Token) => Promise<Token>
	getContract(address: string, abi: Interface): Contract
}

type JSONObject = Partial<Record<symbol, JSONValue>>

type JSONArray = Array<JSONValue>

type JSONValue = string | number | boolean | JSONArray | JSONObject

export type JSONSerializable = JSONValue

export interface WakuObjectState {
	readonly chatId: string
	readonly objectId: string
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: Token[]
}

export interface WakuObjectContext<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
> extends WakuObjectAdapter {
	readonly store?: StoreType
	updateStore: (updater: (state?: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	readonly view?: string
	onViewChange: (view: string) => void
}

export interface WakuObjectArgs<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
> extends WakuObjectContext<StoreType, DataMessageType>,
		WakuObjectState {}

interface WakuObjectDescriptor<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
> {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string

	onMessage?: (
		message: DataMessage<DataMessageType>,
		args: WakuObjectArgs<StoreType, DataMessageType>,
	) => Promise<void>
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}

interface WakuObjectSvelteDescriptor<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
> extends WakuObjectDescriptor<StoreType, DataMessageType> {
	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
	readonly customArgs?: CustomArgs
}
