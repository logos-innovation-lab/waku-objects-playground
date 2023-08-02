import { getFromLocalStorage, saveToLocalStorage } from '$lib/adapters/utils'
import { writable, type Writable } from 'svelte/store'
import { z } from 'zod'

const darkModeSchema = z.enum(['dark', 'light', 'system'])
export type DarkMode = z.infer<typeof darkModeSchema>

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
	darkMode = getFromLocalStorage<DarkMode>('dark-mode', darkModeSchema) ?? darkMode
	baseColor = getFromLocalStorage<string>('color', z.string()) ?? baseColor
	const store = writable<Theme>({ darkMode, baseColor })

	return {
		...store,
		setColor: (newColor: string) => {
			saveToLocalStorage('color', newColor)
			store.update((theme) => ({ ...theme, baseColor: newColor }))
		},
		setDarkMode: (newDarkMode: DarkMode) => {
			saveToLocalStorage('dark-mode', newDarkMode)
			store.update((theme) => ({ ...theme, darkMode: newDarkMode }))
		},
	}
}

export const theme = createThemeStore()
