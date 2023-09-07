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

type StoreType = JSONSerializable
type DataMessageType = JSONSerializable

export interface WakuObjectContextProps<ViewType extends string = string> {
	readonly store?: StoreType
	readonly view?: ViewType
}

export interface WakuObjectContext<ViewType extends string = string> extends WakuObjectContextProps<ViewType>, WakuObjectAdapter {
	updateStore: (updater: (state?: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	readonly view?: ViewType // Screen to show on Waku object
	readonly viewParams: string[] // Other path params after the screen
	onViewChange: (view: ViewType, ...rest: string[]) => void
}

export interface WakuObjectArgs<
	ViewType extends string = string,
> extends WakuObjectContext<ViewType>,
		WakuObjectState {}

interface WakuObjectMetadata {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string
}

interface WakuObjectDescriptor<
	ViewType extends string = string,
> extends WakuObjectMetadata {
	onMessage?: (
		message: DataMessage<DataMessageType>,
		args: WakuObjectArgs<ViewType>,
	) => Promise<void>
}

interface WakuObjectSvelteDescriptor<
	ViewType extends string = string,
> extends WakuObjectDescriptor<ViewType> {
	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
}
