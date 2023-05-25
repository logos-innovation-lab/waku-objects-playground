import { browser } from '$app/environment'
import type { Schema } from 'zod'

type JSONdecoded = string | number | boolean | object | Array<JSONdecoded>

export async function saveToLocalStorage<T extends JSONdecoded>(key: string, data: T) {
	if (!browser || !localStorage) {
		console.error('Error saving to local storage: not in browser', data)
		return
	}

	localStorage.setItem(key, JSON.stringify(data))
}

export function getFromLocalStorage<T extends JSONdecoded>(
	key: string,
	schema: Schema<T>,
): T | undefined {
	if (!browser || !localStorage) {
		console.error('Error getting from local storage: not in browser')
		return
	}

	const data = localStorage.getItem(key)
	if (!data) {
		console.error('Error getting from local storage: no data', data)
		return
	}

	const parsed = JSON.parse(data)
	const parseData = schema.safeParse(parsed)

	if (!parseData.success) {
		console.error(`Error getting from local storage: invalid data. ${parseData.error.issues}`, data)
		return
	}

	return parseData.data
}

export function removeFromLocalStorage(key: string) {
	if (!browser || !localStorage) {
		console.error('Error removing from local storage: not in browser')
		return
	}

	localStorage.removeItem(key)
}
