import type { TokenAmount } from '$lib/objects/schemas'
import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

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
