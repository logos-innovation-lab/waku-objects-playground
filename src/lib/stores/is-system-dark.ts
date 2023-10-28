import { browser } from '$app/environment'
import { readable } from 'svelte/store'

export const isSystemDark = readable(false, (set) => {
	if (!browser) {
		return
	}

	const isDarkQuery = window.matchMedia('(prefers-color-scheme: dark)')
	isDarkQuery.onchange = (event) => set(event.matches)

	set(isDarkQuery.matches)

	return () => (isDarkQuery.onchange = null)
})
