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
export interface JSONArr extends Array<JSONValue> {}

export type JSONValue = JSONPrimitive | JSONObject | JSONArr

export type JSONSerializable = JSONValue

export interface WakuObjectState {
	readonly chatId: string
	readonly objectId: string
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: Token[]
}

type StoreType = JSONSerializable
type DataMessageType = JSONSerializable

export interface WakuObjectContext extends WakuObjectAdapter {
	readonly store?: StoreType
	updateStore: (updater: (state?: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	readonly view?: string
	onViewChange: (view: string) => void
}

export interface WakuObjectArgs extends WakuObjectContext, WakuObjectState {}

interface WakuObjectDescriptor {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string

	onMessage?: (message: DataMessage<DataMessageType>, args: WakuObjectArgs) => Promise<void>
	// TODO onTransaction: (store: unknown, transaction: Transaction) => unknown
}

interface WakuObjectSvelteDescriptor extends WakuObjectDescriptor {
	readonly wakuObject: ComponentType
	readonly standalone?: ComponentType
	readonly customArgs?: CustomArgs
}
