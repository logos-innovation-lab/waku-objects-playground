import { getClosestColor, hexToRgb } from '@waku-objects/luminance'
import { browser } from '$app/environment'
import type { DarkMode } from '$lib/stores/theme'

interface Color {
	name: string
	luminance: number
}

// TODO: maybe these should actually be the other way around? So --white should actually be black and vice versa
const darkColorVars: Color[] = [
	{
		name: '--color-dark-base',
		luminance: 1,
	},
	{
		name: '--color-dark-step-10',
		luminance: 0.85,
	},
	{
		name: '--color-dark-step-20',
		luminance: 0.6,
	},
	{
		name: '--color-dark-step-30',
		luminance: 0.3,
	},
	{
		name: '--color-dark-step-40',
		luminance: 0.03,
	},
	{
		name: '--color-dark-step-50',
		luminance: 0.01,
	},
	{
		name: '--color-dark-accent',
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

export function changeColors(baseColor: string, isDarkMode: boolean) {
	if (!browser) return

	const colors = isDarkMode ? darkColorVars : lightColorsVars
	const colorsToRemove = isDarkMode ? lightColorsVars : darkColorVars

	// Define the correct variant of colors (either dark or light)
	colors.forEach(({ name, luminance }) => {
		const color = getClosestColor(baseColor, luminance)
		const { r, g, b } = hexToRgb(color)
		document.documentElement.style.setProperty(name, color)
		// FIXME: we likely just need the RGB variant not the hex ones
		document.documentElement.style.setProperty(
			`${name}-rgb`,
			`${r.toFixed()}, ${g.toFixed()}, ${b.toFixed()}`,
		)
	})

	// Remove the unused variant of colors (either dark or light)
	colorsToRemove.forEach(({ name }) => {
		document.documentElement.style.removeProperty(name)
		document.documentElement.style.removeProperty(`${name}-rgb`)
	})
}
