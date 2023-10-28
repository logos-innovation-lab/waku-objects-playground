import { getFromLocalStorage, saveToLocalStorage } from '$lib/adapters/utils'
import { writable, type Writable } from 'svelte/store'
import { z } from 'zod'

export const fiatSymbolList = ['DAI', 'EUR', 'USD', 'CZK'] as const
const fiatSymbolSchema = z.enum(fiatSymbolList)
export type FiatSymbol = z.infer<typeof fiatSymbolSchema>

interface Preferences {
	fiatSymbol: FiatSymbol
}

interface PreferenceStore extends Writable<Preferences> {
	setFiatSymbol: (newFiatSymbol: FiatSymbol) => void
}

function createPreferenceStore(): PreferenceStore {
	let fiatSymbol: FiatSymbol = 'DAI'
	try {
		fiatSymbol = getFromLocalStorage<FiatSymbol>('fiat', fiatSymbolSchema) ?? fiatSymbol
	} catch (error) {
		// this is fine
	}
	const store = writable<Preferences>({ fiatSymbol })

	return {
		...store,
		setFiatSymbol: (newFiatSymbol: FiatSymbol) => {
			saveToLocalStorage('fiat', newFiatSymbol)
			store.update((theme) => ({ ...theme, fiatSymbol: newFiatSymbol }))
		},
	}
}

export const preferrences = createPreferenceStore()
