import type { Contract, Interface } from 'ethers'
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
