import { browser } from '$app/environment'
import { readable } from 'svelte/store'

const isDarkQuery = browser && window.matchMedia('(prefers-color-scheme: dark)')

export const isSystemDark = !isDarkQuery
	? readable(false)
	: readable(isDarkQuery.matches, (set) => {
			isDarkQuery.onchange = (event) => set(event.matches)
			return () => (isDarkQuery.onchange = null)
	  })
