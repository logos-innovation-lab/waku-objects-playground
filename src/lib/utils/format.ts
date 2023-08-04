import { browser } from '$app/environment'

export function formatAddress(address: string, prefix = 4, suffix = 0) {
	if (suffix) return `${address.slice(0, prefix + 2)}...${address.slice(-suffix)}`
	return `${address.slice(0, prefix + 2)}`
}

export function toSignificant(
	amount: bigint,
	decimals: number,
	minDecimalsOrSignificantDigits = 2,
): string {
	return toSignificantString(toDecimal(amount, decimals), minDecimalsOrSignificantDigits)
}

export function toDecimal(amount: bigint, decimals: number): string {
	const str = amount.toString()

	if (decimals === 0) return str

	const wholePart = str.slice(0, -decimals) || '0'
	const fractionalPart = str.slice(-decimals).padStart(decimals, '0')

	return wholePart + (fractionalPart ? '.' + fractionalPart : '')
}

export function toSignificantString(value: string, minDecimalsOrSignificantDigits = 2): string {
	const split = value.split('.')
	const wholePart = split[0]
	let fractionalPart = (split[1] || '').replace(/0+$/, '')

	let firstNonZeroIndex = -1
	for (let i = 0; i < fractionalPart.length; i++) {
		if (firstNonZeroIndex === -1 && fractionalPart[i] !== '0') {
			firstNonZeroIndex = i
			break
		}
	}
	if (firstNonZeroIndex === -1) firstNonZeroIndex = 0

	fractionalPart = fractionalPart
		.slice(0, firstNonZeroIndex + minDecimalsOrSignificantDigits)
		.padEnd(minDecimalsOrSignificantDigits, '0')

	return wholePart + (fractionalPart ? '.' + fractionalPart : '')
}

function validateDecimal(number: string) {
	// This regex will match a string that starts with one or more digits (\d+),
	// followed by an optional part that starts with a dot (\.?) and continues with one or more digits (\d*)
	const regex = /^\d+(\.\d*)?$/

	if (!regex.test(number)) {
		throw new Error('Invalid decimal number format')
	}
}

export function toBigInt(decimalString: string, decimals: number): bigint | never {
	validateDecimal(decimalString)

	// Split the string into whole and fractional parts
	const [wholePart, fractionalPart = ''] = decimalString.split('.')

	// Construct a new string with the correct number of decimals
	const paddedFractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals)

	// Parse the resulting string to a BigInt
	return BigInt(wholePart + paddedFractionalPart)
}

export function formatDateAndTime(timestamp: number) {
	if (!browser) {
		return ''
	}
	const locale = navigator.language
	const date = new Date(timestamp)
	const dateFormat = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	})
	let dateString = dateFormat.format(date)
	const today = new Date()
	const yesterday = new Date(today).setDate(today.getDate() - 1)

	if (dateString === dateFormat.format(today)) {
		dateString = 'Today'
	} else if (dateString === dateFormat.format(yesterday)) {
		dateString = 'Yesterday'
	}
	const timeFormat = new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	})
	const dateTime = timeFormat.format(date)
	return `${dateString} at ${dateTime}`
}
