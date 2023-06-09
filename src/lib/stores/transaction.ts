/* eslint-disable @typescript-eslint/no-empty-interface */

import { writable, type Writable } from 'svelte/store'
import type { Token } from './balances'
import type { User } from './users'

export interface TransactionEvent {}

export interface Transaction {
	from: User
	to: User
	token: Token
	amount: bigint
	fee: bigint
	txHash: string
	status: 'confirmed' | 'pending' | 'failed'
	history: TransactionEvent[]
}

export interface TransactionData {
	loading: boolean
	transactions: Map<string, Transaction>
	error?: Error
}

export type TransactionStore = Writable<TransactionData>

function createTransactionStore(): TransactionStore {
	const store = writable<TransactionData>({
		loading: true,
		transactions: new Map<string, Transaction>(),
	})

	return store
}

export const transactions = createTransactionStore()
