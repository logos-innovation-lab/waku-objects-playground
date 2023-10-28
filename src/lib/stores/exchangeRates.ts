import { writable, get } from 'svelte/store'
import type { Writable } from 'svelte/store'
import { z } from 'zod'
import { defaultBlockchainNetwork } from '$lib/adapters/transaction'

function createSchema(tokens: string[]) {
	const schemas: Record<string, z.ZodNumber> = {}
	for (const token of tokens) {
		schemas[token] = z.number()
	}
	return z.object(schemas)
}

// TODO: with centralised endpoint, we can add more fiat currencies
const fiatList = ['DAI', 'EUR', 'USD', 'CZK']

const resSchema = createSchema(fiatList)
type ExchangeRates = z.infer<typeof resSchema>

export interface ExchangeRateRecord {
	rates: ExchangeRates
	refreshing: boolean
	checkedAt?: number
	error?: Error
}

interface ExchangeRateState {
	exchange: Map<string, ExchangeRateRecord>
}

interface BalanceRateStore extends Writable<ExchangeRateState> {
	update: () => void
	addToken: (token: string) => void
}

async function fetchTokenPrice(symbol: string): Promise<ExchangeRates> {
	const endpoint = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=${fiatList.join(
		',',
	)}&extraParams=0f8e116726ca17f20d95cd93fb85c7740c3bdb86719a58164ca28ed10df3320c`
	const response = await fetch(endpoint)

	if (!response.ok) {
		throw new Error(response.statusText)
	}

	const data = await response.json()
	const result = resSchema.safeParse(data)
	if (!result.success) {
		throw new Error(result.error.message)
	}

	return result.data
}

function createExchangeStore(): BalanceRateStore {
	const exchange = new Map<string, ExchangeRateRecord>()
	for (const token of [
		defaultBlockchainNetwork.nativeToken,
		...(defaultBlockchainNetwork.tokens ?? []),
	]) {
		exchange.set(token.symbol, { rates: {}, refreshing: false })
	}
	const store = writable<ExchangeRateState>({ exchange })

	const update = async () => {
		const { exchange } = get(store)

		for (const [symbol, data] of exchange) {
			const checkedAt = Date.now()
			let rates: ExchangeRates = data.rates
			let error: Error | undefined = undefined

			// Don't refresh if we're already refreshing or if we've checked in the last 10 seconds
			if (data.refreshing || (data.checkedAt && checkedAt - data.checkedAt < 1000 * 10)) return

			exchange.set(symbol, { ...data, checkedAt, refreshing: true })
			store.set({ exchange })

			store.update((state) => {
				const { exchange } = state
				exchange.set(symbol, { ...data, checkedAt, refreshing: true })
				return { exchange }
			})

			try {
				rates = await fetchTokenPrice(symbol)
				console.log(rates)
			} catch (err) {
				error = err as Error
			}

			store.update((state) => {
				const { exchange } = state
				exchange.set(symbol, { checkedAt, refreshing: false, rates, error })
				return { exchange }
			})
		}
	}
	update()

	const addToken = (token: string) => {
		const tokens = get(store).exchange
		tokens.set(token, { rates: {}, refreshing: false })
		store.set({ exchange: tokens })
	}

	return { ...store, update, addToken }
}

export const exchangeStore = createExchangeStore()
export const DEFAULT_FIAT_SYMBOL = fiatList[1] // TODO: we could set this in user preferences as originally designed
