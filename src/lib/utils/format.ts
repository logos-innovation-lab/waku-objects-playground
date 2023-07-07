export function formatAddress(address: string, prefix = 4, suffix = 0) {
	if (suffix) return `${address.substring(0, prefix + 2)}...${address.substring(-suffix, suffix)}`
	return `${address.substring(0, prefix + 2)}`
}

export function formatTokenAmount(amount: bigint, decimals: number, precision = 2): string {
	return (Number(amount / 10n ** BigInt(decimals - precision)) / 10 ** precision).toFixed(precision)
}

export function toSignificant(amount: bigint, decimals: number, significantDigits: number): string {
	const str = amount.toString()

	let wholePart = str.slice(0, -decimals) || '0'
	let fractionalPart = str.slice(-decimals).padStart(decimals, '0')

	// Remove trailing zeroes from the fractional part
	while (fractionalPart[fractionalPart.length - 1] === '0') {
		fractionalPart = fractionalPart.slice(0, -1)
	}

	// If the significant digits are less than the whole part's length, we need to cut off the extra digits
	if (significantDigits < wholePart.length) {
		const digitsToCut = wholePart.length - significantDigits
		fractionalPart = wholePart.slice(-digitsToCut) + fractionalPart
		wholePart = wholePart.slice(0, -digitsToCut)
	}

	// Cut the fractional part to fit into the significant digits
	fractionalPart = fractionalPart.slice(0, significantDigits - wholePart.length)

	return wholePart + (fractionalPart ? '.' + fractionalPart : '')
}

export function toBigInt(decimalString: string, decimals: number): bigint {
	// Split the string into whole and fractional parts
	const [wholePart, fractionalPart = ''] = decimalString.split('.')

	// Construct a new string with the correct number of decimals
	const paddedFractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals)

	// Parse the resulting string to a BigInt
	return BigInt(wholePart + paddedFractionalPart)
}
