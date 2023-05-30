import { browser } from '$app/environment'

type JSONdecoded = string | number | boolean | object | Array<JSONdecoded>

export async function saveToLocalStorage<T extends JSONdecoded>(key: string, data: T) {
	if (browser && localStorage) {
		localStorage.setItem(key, JSON.stringify(data))
	}
}

export function getFromLocalStorage<T extends JSONdecoded>(key: string, defaultValue: T): T {
	if (browser && localStorage) {
		const data = localStorage.getItem(key)
		return data ? JSON.parse(data) as T : defaultValue
	}

	return defaultValue
}