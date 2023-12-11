import type { TokenAmount } from '$lib/stores/balances'
import type { ChatType, DataMessage } from '$lib/stores/chat'
import type { ComponentType } from 'svelte'
import type { Transaction, User, TransactionState } from './schemas'
import type { Contract, Interface } from 'ethers'
import type { ExchangeRateRecord } from '$lib/stores/exchangeRates'
import type { ErrorDescriptor } from '$lib/stores/error'

export interface WakuObjectAdapter {
	getTransaction(txHash: string): Promise<Transaction | undefined>
	getTransactionState(txHash: string): Promise<TransactionState>
	waitForTransaction(txHash: string): Promise<TransactionState>
	checkBalance(token: TokenAmount): Promise<void>
	sendTransaction: (to: string, token: TokenAmount) => Promise<string>
	estimateTransaction: (to: string, token: TokenAmount) => Promise<TokenAmount>
	getContract(address: string, abi: Interface): Contract

	// TODO: Add typings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	rpcRequest(method: string, params: any): Promise<any>
}

export type JSONPrimitive = string | number | boolean | null
export type JSONObject = { [key: symbol]: JSONValue }
export type JSONArray = Array<JSONValue>

export type JSONValue = JSONPrimitive | JSONObject | JSONArray

export type JSONSerializable = JSONValue

export interface WakuObjectState {
	readonly chainId: bigint
	readonly chatId: string
	readonly objectId: string
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: TokenAmount[]
	readonly exchangeRates: Map<string, ExchangeRateRecord>
	readonly fiatSymbol: FiatSymbol
	readonly chatName: string
	readonly chatType: ChatType
}

type StoreType = JSONSerializable
type DataMessageType = JSONSerializable

export interface WakuObjectContextProps<
	StoreType = JSONSerializable,
	ViewType extends string = string,
> {
	readonly store?: StoreType
	readonly view?: ViewType
	readonly viewParams: string[] // Other path params after the screen
}

export interface WakuObjectContext<
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectContextProps<StoreType, ViewType>,
		WakuObjectAdapter {
	updateStore: (updater: (state?: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	onViewChange: (view: ViewType, ...rest: string[]) => void

	addError: (error: ErrorDescriptor) => void
}

export interface WakuObjectArgs<
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
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
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectMetadata {
	onMessage?: (
		message: DataMessage<DataMessageType>,
		args: WakuObjectArgs<StoreType, DataMessageType, ViewType>,
	) => Promise<void>
}

interface WakuObjectSvelteDescriptor<
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectDescriptor<StoreType, DataMessageType, ViewType> {
	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
}
