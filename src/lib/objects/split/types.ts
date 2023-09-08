import type { BigNumberish, Contract, ContractTransactionResponse, Interface } from 'ethers'
import type { Expense, Payment } from './schemas'

export type View =
	| 'amount'
	| 'name'
	| 'images'
	| 'summary'
	| 'expense'
	| 'overview'
	| 'accounting'
	| 'collection'
	| 'expenses'
	| 'activity'
	| 'settle'

export type ExpenseActivity = Expense & { type: 'expense' }
export type PaymentActivity = Payment & { type: 'payment' }
export type Activity = ExpenseActivity | PaymentActivity
export type GetContract = (address: string, abi: Interface) => Contract

export type SplitterFactoryContract = Contract & {
	masterSplitter(): Promise<string[]>
	create(metadata: string, token: string, members: string[]): Promise<ContractTransactionResponse>
}

type TransactionOverrides = {
	nonce?: number
	gasLimit?: BigNumberish
	gasPrice?: BigNumberish
	value?: BigNumberish
	chainId?: number
}

export type SplitterContract = Contract & {
	metadata(): Promise<string[]>
	token(): Promise<string>
	members(index: number): Promise<string[]>
	isMember(addr: string): Promise<boolean>
	debts(addr: string): Promise<bigint>
	init(metadata: string, token: string, members: string[]): Promise<ContractTransactionResponse>
	addMember(member: string): Promise<ContractTransactionResponse>
	addExpense(
		metadata: string,
		amount: bigint,
		payor: string,
		targets: string[],
	): Promise<ContractTransactionResponse>
	getMembers(): Promise<string[]>
	settleDebts(user: string, overrides?: TransactionOverrides): Promise<ContractTransactionResponse>
	settleDebts(overrides?: TransactionOverrides): Promise<ContractTransactionResponse>
}
