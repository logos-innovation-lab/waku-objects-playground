/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
	BaseContract,
	BigNumberish,
	BytesLike,
	FunctionFragment,
	Result,
	Interface,
	EventFragment,
	AddressLike,
	ContractRunner,
	ContractMethod,
	Listener,
} from 'ethers'
import type {
	TypedContractEvent,
	TypedDeferredTopicFilter,
	TypedEventLog,
	TypedLogDescription,
	TypedListener,
	TypedContractMethod,
} from './common'

export interface SplitterInterface extends Interface {
	getFunction(
		nameOrSignature:
			| 'addExpense'
			| 'addMember'
			| 'debts'
			| 'getMembers'
			| 'init'
			| 'isMember'
			| 'members'
			| 'metadata'
			| 'settleDebts(address)'
			| 'settleDebts()'
			| 'token',
	): FunctionFragment

	getEvent(nameOrSignatureOrTopic: 'ExpenseAdded'): EventFragment

	encodeFunctionData(
		functionFragment: 'addExpense',
		values: [BytesLike, BigNumberish, AddressLike, AddressLike[]],
	): string
	encodeFunctionData(functionFragment: 'addMember', values: [AddressLike]): string
	encodeFunctionData(functionFragment: 'debts', values: [AddressLike]): string
	encodeFunctionData(functionFragment: 'getMembers', values?: undefined): string
	encodeFunctionData(
		functionFragment: 'init',
		values: [BytesLike, AddressLike, AddressLike[]],
	): string
	encodeFunctionData(functionFragment: 'isMember', values: [AddressLike]): string
	encodeFunctionData(functionFragment: 'members', values: [BigNumberish]): string
	encodeFunctionData(functionFragment: 'metadata', values?: undefined): string
	encodeFunctionData(functionFragment: 'settleDebts(address)', values: [AddressLike]): string
	encodeFunctionData(functionFragment: 'settleDebts()', values?: undefined): string
	encodeFunctionData(functionFragment: 'token', values?: undefined): string

	decodeFunctionResult(functionFragment: 'addExpense', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'addMember', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'debts', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'getMembers', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'init', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'isMember', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'members', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'metadata', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'settleDebts(address)', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'settleDebts()', data: BytesLike): Result
	decodeFunctionResult(functionFragment: 'token', data: BytesLike): Result
}

export namespace ExpenseAddedEvent {
	export type InputTuple = [
		metadata: BytesLike,
		amount: BigNumberish,
		paidBy: AddressLike,
		targets: AddressLike[],
	]
	export type OutputTuple = [metadata: string, amount: bigint, paidBy: string, targets: string[]]
	export interface OutputObject {
		metadata: string
		amount: bigint
		paidBy: string
		targets: string[]
	}
	export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>
	export type Filter = TypedDeferredTopicFilter<Event>
	export type Log = TypedEventLog<Event>
	export type LogDescription = TypedLogDescription<Event>
}

export interface Splitter extends BaseContract {
	connect(runner?: ContractRunner | null): Splitter
	waitForDeployment(): Promise<this>

	interface: SplitterInterface

	queryFilter<TCEvent extends TypedContractEvent>(
		event: TCEvent,
		fromBlockOrBlockhash?: string | number | undefined,
		toBlock?: string | number | undefined,
	): Promise<Array<TypedEventLog<TCEvent>>>
	queryFilter<TCEvent extends TypedContractEvent>(
		filter: TypedDeferredTopicFilter<TCEvent>,
		fromBlockOrBlockhash?: string | number | undefined,
		toBlock?: string | number | undefined,
	): Promise<Array<TypedEventLog<TCEvent>>>

	on<TCEvent extends TypedContractEvent>(
		event: TCEvent,
		listener: TypedListener<TCEvent>,
	): Promise<this>
	on<TCEvent extends TypedContractEvent>(
		filter: TypedDeferredTopicFilter<TCEvent>,
		listener: TypedListener<TCEvent>,
	): Promise<this>

	once<TCEvent extends TypedContractEvent>(
		event: TCEvent,
		listener: TypedListener<TCEvent>,
	): Promise<this>
	once<TCEvent extends TypedContractEvent>(
		filter: TypedDeferredTopicFilter<TCEvent>,
		listener: TypedListener<TCEvent>,
	): Promise<this>

	listeners<TCEvent extends TypedContractEvent>(
		event: TCEvent,
	): Promise<Array<TypedListener<TCEvent>>>
	listeners(eventName?: string): Promise<Array<Listener>>
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>

	addExpense: TypedContractMethod<
		[_metadata: BytesLike, _amount: BigNumberish, _payor: AddressLike, _targets: AddressLike[]],
		[void],
		'nonpayable'
	>

	addMember: TypedContractMethod<[member: AddressLike], [void], 'nonpayable'>

	debts: TypedContractMethod<[arg0: AddressLike], [bigint], 'view'>

	getMembers: TypedContractMethod<[], [string[]], 'view'>

	init: TypedContractMethod<
		[_metadata: BytesLike, _token: AddressLike, _members: AddressLike[]],
		[void],
		'nonpayable'
	>

	isMember: TypedContractMethod<[arg0: AddressLike], [boolean], 'view'>

	members: TypedContractMethod<[arg0: BigNumberish], [string], 'view'>

	metadata: TypedContractMethod<[], [string], 'view'>

	'settleDebts(address)': TypedContractMethod<[user: AddressLike], [void], 'payable'>

	'settleDebts()': TypedContractMethod<[], [void], 'payable'>

	token: TypedContractMethod<[], [string], 'view'>

	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T

	getFunction(
		nameOrSignature: 'addExpense',
	): TypedContractMethod<
		[_metadata: BytesLike, _amount: BigNumberish, _payor: AddressLike, _targets: AddressLike[]],
		[void],
		'nonpayable'
	>
	getFunction(
		nameOrSignature: 'addMember',
	): TypedContractMethod<[member: AddressLike], [void], 'nonpayable'>
	getFunction(nameOrSignature: 'debts'): TypedContractMethod<[arg0: AddressLike], [bigint], 'view'>
	getFunction(nameOrSignature: 'getMembers'): TypedContractMethod<[], [string[]], 'view'>
	getFunction(
		nameOrSignature: 'init',
	): TypedContractMethod<
		[_metadata: BytesLike, _token: AddressLike, _members: AddressLike[]],
		[void],
		'nonpayable'
	>
	getFunction(
		nameOrSignature: 'isMember',
	): TypedContractMethod<[arg0: AddressLike], [boolean], 'view'>
	getFunction(
		nameOrSignature: 'members',
	): TypedContractMethod<[arg0: BigNumberish], [string], 'view'>
	getFunction(nameOrSignature: 'metadata'): TypedContractMethod<[], [string], 'view'>
	getFunction(
		nameOrSignature: 'settleDebts(address)',
	): TypedContractMethod<[user: AddressLike], [void], 'payable'>
	getFunction(nameOrSignature: 'settleDebts()'): TypedContractMethod<[], [void], 'payable'>
	getFunction(nameOrSignature: 'token'): TypedContractMethod<[], [string], 'view'>

	getEvent(
		key: 'ExpenseAdded',
	): TypedContractEvent<
		ExpenseAddedEvent.InputTuple,
		ExpenseAddedEvent.OutputTuple,
		ExpenseAddedEvent.OutputObject
	>

	filters: {
		'ExpenseAdded(bytes,uint256,address,address[])': TypedContractEvent<
			ExpenseAddedEvent.InputTuple,
			ExpenseAddedEvent.OutputTuple,
			ExpenseAddedEvent.OutputObject
		>
		ExpenseAdded: TypedContractEvent<
			ExpenseAddedEvent.InputTuple,
			ExpenseAddedEvent.OutputTuple,
			ExpenseAddedEvent.OutputObject
		>
	}
}
