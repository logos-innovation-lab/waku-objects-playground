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
		name: '--color-base',
		luminance: 1,
	},
	{
		name: '--color-step-10',
		luminance: 0.85,
	},
	{
		name: '--color-step-20',
		luminance: 0.6,
	},
	{
		name: '--color-step-30',
		luminance: 0.3,
	},
	{
		name: '--color-step-40',
		luminance: 0.03,
	},
	{
		name: '--color-step-50',
		luminance: 0.01,
	},
	{
		name: '--color-accent',
		luminance: 0,
	},
]

const lightColorsVars: Color[] = [
	{
		name: '--color-base',
		luminance: 1,
	},
	{
		name: '--color-step-10',
		luminance: 0.9,
	},
	{
		name: '--color-step-20',
		luminance: 0.8,
	},
	{
		name: '--color-step-30',
		luminance: 0.5,
	},
	{
		name: '--color-step-40',
		luminance: 0.2,
	},
	{
		name: '--color-step-50',
		luminance: 0.05,
	},
	{
		name: '--color-accent',
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
