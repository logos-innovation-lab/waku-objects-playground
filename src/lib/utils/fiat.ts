import type { ExchangeRateRecord } from '$lib/stores/exchangeRates'
import { isValidNumber } from '$lib/utils'

interface FiatAmount {
	symbol: string
	amount: number
	error?: Error
	refreshing: boolean
}

function calculateFiatAmount(
	fiatRates: Map<string, ExchangeRateRecord>,
	fiatSymbol: string,
	tokenAmount: number,
	tokenSymbol: string,
): FiatAmount {
	const exchangeRate = fiatRates.get(tokenSymbol)
	const rate = exchangeRate?.rates[fiatSymbol]

	if (rate === undefined)
		return {
			symbol: fiatSymbol,
			amount: 0,
			refreshing: Boolean(exchangeRate?.refreshing),
			error: new Error(`No exchange rate for ${tokenSymbol} to ${fiatSymbol}`),
		}

	return {
		symbol: fiatSymbol,
		amount: tokenAmount * rate,
		refreshing: Boolean(exchangeRate?.refreshing),
		error: exchangeRate?.error,
	}
}

export function getFiatAmountText(
	fiatRates: Map<string, ExchangeRateRecord>,
	fiatSymbol: string,
	tokenAmount: string,
	tokenSymbol: string,
): string {
	if (tokenAmount === '') {
		const fiatAmount = calculateFiatAmount(fiatRates, fiatSymbol, 1, tokenSymbol)
		if (fiatAmount.amount !== undefined)
			return `1 ${tokenSymbol} ≈ ${fiatAmount.amount.toFixed(2)} ${fiatSymbol}`
		if (fiatAmount.refreshing) return `Getting exchange rate`
		return `Failed to load ${fiatSymbol} amount`
	}
	
	if (!isValidNumber(tokenAmount)) return 'Please enter a valid number'
	const amount = Number(tokenAmount)
	if (isNaN(amount)) return 'Please enter a valid number'
	const fiatAmount = calculateFiatAmount(fiatRates, fiatSymbol, amount, tokenSymbol)
	if (fiatAmount.amount !== undefined) return `≈${fiatAmount.amount.toFixed(2)} ${fiatSymbol}`
	if (fiatAmount.refreshing) return `Getting exchange rate`
	return `Failed to load ${fiatSymbol} amount`
}
