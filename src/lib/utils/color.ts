import { getClosestColor } from '@waku-objects/luminance'
import { browser } from '$app/environment'
import type { DarkMode } from '$lib/stores/theme'

interface Color {
	name: string
	luminance: number
}

// TODO: maybe these should actually be the other way around? So --white should actually be black and vice versa
const darkColorVars: Color[] = [
	{
		name: '--white',
		luminance: 1,
	},
	{
		name: '--ultra-light',
		luminance: 0.85,
	},
	{
		name: '--light',
		luminance: 0.6,
	},
	{
		name: '--mid',
		luminance: 0.3,
	},
	{
		name: '--dark',
		luminance: 0.03,
	},
	{
		name: '--ultra-dark',
		luminance: 0.01,
	},
	{
		name: '--black',
		luminance: 0,
	},
]

const lightColorsVars: Color[] = [
	{
		name: '--white',
		luminance: 1,
	},
	{
		name: '--ultra-light',
		luminance: 0.9,
	},
	{
		name: '--light',
		luminance: 0.8,
	},
	{
		name: '--mid',
		luminance: 0.5,
	},
	{
		name: '--dark',
		luminance: 0.2,
	},
	{
		name: '--ultra-dark',
		luminance: 0.05,
	},
	{
		name: '--black',
		luminance: 0,
	},
]

export function changeColors(baseColor: string, darkMode: DarkMode) {
	if (!browser) return

	const isDarkMode =
		darkMode === 'dark' ||
		(darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
	const colors = isDarkMode ? darkColorVars : lightColorsVars

	colors.forEach(({ name, luminance }) => {
		const color = getClosestColor(baseColor, luminance)
		document.documentElement.style.setProperty(name, color)
	})
}
