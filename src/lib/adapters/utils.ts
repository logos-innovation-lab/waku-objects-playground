import { browser } from '$app/environment'
import type { Schema } from 'zod'

type JSONdecoded = string | number | boolean | object | Array<JSONdecoded>

/**
 * Sleep for N miliseconds
 *
 * @param ms Number of miliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise<void>((resolve) => setTimeout(() => resolve(), ms))
}

export async function saveToLocalStorage<T extends JSONdecoded>(
	key: string,
	schema: Schema<T>,
	data: T,
) {
	const parseData = schema.safeParse(data)
	if (parseData.success === false) {
		throw new Error(`Error saving to local storage: ${parseData.error.issues}`)
	}
	if (browser && localStorage) {
		localStorage.setItem(key, JSON.stringify(data))
	}
}

export function getFromLocalStorage<T extends JSONdecoded>(
	key: string,
	schema: Schema<T>,
): T | undefined {
	if (browser && localStorage) {
		const data = localStorage.getItem(key)
		if (data) {
			const parsed = JSON.parse(data)
			const parseData = schema.safeParse(parsed)
			if (parseData.success) {
				return parseData.data
			}
		}
	}
}
