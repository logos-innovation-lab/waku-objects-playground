import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

export interface TokenAmount {
	name: string
	symbol: string
	amount: bigint
	decimals: number
	image?: string
	address?: string // if not set, it is the native token
}

interface BalanceState {
	balances: TokenAmount[]
	loading: boolean
	error?: Error
}

type BalanceStore = Writable<BalanceState>

function createBalanceStore(): BalanceStore {
	const store = writable<BalanceState>({ loading: true, balances: [] })

	return store
}

export const balanceStore = createBalanceStore()
