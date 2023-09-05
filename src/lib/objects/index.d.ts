import type { Token } from '$lib/stores/balances'
import type { DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'
import type { Transaction, User, TransactionState } from './schemas'
import type { Contract, Interface } from 'ethers'
import type { CustomArgs } from ''

export interface WakuObjectAdapter {
	getTransaction(txHash: string): Promise<Transaction | undefined>
	getTransactionState(txHash: string): Promise<TransactionState>
	waitForTransaction(txHash: string): Promise<TransactionState>
	checkBalance(token: Token): Promise<void>
	sendTransaction: (to: string, token: Token) => Promise<string>
	estimateTransaction: (to: string, token: Token) => Promise<Token>
	getContract(address: string, abi: Interface): Contract
}

export type JSONPrimitive = string | number | boolean | null
export type JSONObject = { [key: symbol]: JSONValue }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JSONArray extends Array<JSONValue> {}

export type JSONValue = JSONPrimitive | JSONObject | JSONArray

export type JSONSerializable = JSONValue

export interface WakuObjectState {
	readonly chatId: string
	readonly objectId: string
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: Token[]
	readonly chatName: string
}

export interface WakuObjectContext<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectAdapter {
	readonly store?: StoreType
	updateStore: (updater: (state?: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	readonly view?: ViewType // Screen to show on Waku object
	readonly params: string[] // Other path params after the screen
	onViewChange: (view: ViewType, ...rest: string[]) => void
}

export interface WakuObjectArgs<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectContext<StoreType, DataMessageType, ViewType>,
		WakuObjectState {}

interface WakuObjectMetadata {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string
}

interface WakuObjectDescriptor<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectMetadata {
	onMessage?: (
		message: DataMessage<DataMessageType>,
		args: WakuObjectArgs<StoreType, DataMessageType, ViewType>,
	) => Promise<void>
}

export type CustomArgs = {
	name: string
}

interface WakuObjectSvelteDescriptor<
	StoreType extends JSONSerializable = JSONSerializable,
	DataMessageType extends JSONSerializable = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectDescriptor<StoreType, DataMessageType, ViewType> {
	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
	readonly customArgs?: CustomArgs
}
