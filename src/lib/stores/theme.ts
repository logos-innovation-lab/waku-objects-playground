import { browser } from '$app/environment'
import { writable, type Writable } from 'svelte/store'

export type DarkMode = 'dark' | 'light' | 'system'

interface Theme {
	darkMode: DarkMode
	baseColor: string
}

interface ThemeStore extends Writable<Theme> {
	setColor: (newColor: string) => void
	setDarkMode: (newDarkMode: DarkMode) => void
}

function createThemeStore(): ThemeStore {
	let darkMode: DarkMode = 'system'
	let baseColor = '#000000'
	if (browser) {
		darkMode = (localStorage.getItem('dark-mode') as DarkMode) ?? darkMode
		baseColor = localStorage.getItem('color') ?? baseColor
	}
	const store = writable<Theme>({ darkMode, baseColor })
	return {
		...store,
		setColor: (newColor: string) => {
			localStorage.setItem('color', newColor)
			store.update((theme) => ({ ...theme, baseColor: newColor }))
		},
		setDarkMode: (newDarkMode: DarkMode) => {
			localStorage.setItem('dark-mode', newDarkMode)
			store.update((theme) => ({ ...theme, darkMode: newDarkMode }))
		},
	}
}

export const theme = createThemeStore()
