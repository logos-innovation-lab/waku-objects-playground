import { browser } from '$app/environment'
import type { Schema } from 'zod'

type JSONdecoded = string | number | boolean | object | Array<JSONdecoded>

export async function saveToLocalStorage<T extends JSONdecoded>(key: string, data: T) {
	// Run in browser context only
	if (!browser) return

	if (!localStorage) {
		throw new Error('Error saving to local storage: no local storage')
	}

	localStorage.setItem(key, JSON.stringify(data))
}

export function getFromLocalStorage<T extends JSONdecoded>(
	key: string,
	schema: Schema<T>,
): T | undefined {
	// Run in browser context only
	if (!browser) return

	if (!localStorage) {
		throw new Error('Error getting from local storage: no local storage')
	}

	const data = localStorage.getItem(key)
	if (!data) {
		throw new Error('Error getting from local storage: no data')
	}

	let parsed: unknown

	try {
		parsed = JSON.parse(data)
	} catch (error) {
		throw new Error(
			`Error getting from local storage: JSON parse error ${(error as Error).message}`,
		)
	}

	const parseData = schema.safeParse(parsed)

	if (!parseData.success) {
		throw new Error(`Error getting from local storage: invalid data. ${parseData.error.issues}`)
	}

	console.log('Retrieved', key, parseData.data)

	return parseData.data
}

export function removeFromLocalStorage(key: string) {
	// Run in browser context only
	if (!browser) return

	if (!localStorage) {
		throw new Error('Error removing from local storage: no local storage')
	}

	localStorage.removeItem(key)
}
