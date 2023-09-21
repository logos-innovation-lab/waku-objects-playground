import type { ExchangeRateRecord } from '$lib/stores/exchangeRates'

interface FiatAmount {
	symbol?: string
	amount?: number
	error?: Error
	refreshing: boolean
}

function calculateFiatAmount(
	fiatRates: Map<string, ExchangeRateRecord>,
	fiatSymbol?: string,
	tokenAmount?: string,
	tokenSymbol?: string,
): FiatAmount {
	if (!fiatSymbol || !tokenAmount || !tokenSymbol) return { symbol: fiatSymbol, refreshing: false }
	const exchangeRate = fiatRates.get(tokenSymbol)
	const rate = exchangeRate?.rates[fiatSymbol]
	let amount: number | undefined = undefined

	if (rate !== undefined) amount = Number(tokenAmount) * rate

	return {
		symbol: fiatSymbol,
		amount,
		refreshing: Boolean(exchangeRate?.refreshing),
		error: exchangeRate?.error,
	}
}

export function getFiatAmountText(
	fiatRates: Map<string, ExchangeRateRecord>,
	fiatSymbol?: string,
	tokenAmount?: string,
	tokenSymbol?: string,
): string {
	const fiatAmount = calculateFiatAmount(fiatRates, fiatSymbol, tokenAmount, tokenSymbol)
	if (fiatAmount.amount !== undefined) return `≈${fiatAmount.amount.toFixed(2)} ${fiatSymbol}`
	else if (fiatAmount.refreshing) return `Getting exchange rate`
	return `Failed to load ${fiatSymbol} amount`
}
