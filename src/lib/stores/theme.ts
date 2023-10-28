import { getFromLocalStorage, saveToLocalStorage } from '$lib/adapters/utils'
import { writable, type Writable } from 'svelte/store'
import { z } from 'zod'
import { isSystemDark } from './is-system-dark'

const darkModeSchema = z.enum(['dark', 'light', 'system'])
export type DarkMode = z.infer<typeof darkModeSchema>

interface Theme {
	darkMode: DarkMode
	baseColor: string
	isDarkMode: boolean
}

interface ThemeStore extends Writable<Theme> {
	setColor: (newColor: string) => void
	setDarkMode: (newDarkMode: DarkMode) => void
}

function createThemeStore(): ThemeStore {
	let darkMode: DarkMode = 'system'
	let baseColor = '#000000'
	try {
		darkMode = getFromLocalStorage<DarkMode>('dark-mode', darkModeSchema) ?? darkMode
	} catch (error) {
		// this is fine
	}
	try {
		baseColor = getFromLocalStorage<string>('color', z.string()) ?? baseColor
	} catch (error) {
		// this is fine
	}
	const store = writable<Theme>({ darkMode, baseColor, isDarkMode: false })

	isSystemDark.subscribe((isSystemDark) => {
		store.update((theme) => ({
			...theme,
			isDarkMode: isSystemDark && theme.darkMode === 'system',
		}))
	})

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
