export function formatAddress(address: string, prefix = 4, suffix = 0) {
	if (suffix) return `${address.substring(0, prefix + 2)}...${address.substring(-suffix, suffix)}`
	return `${address.substring(0, prefix + 2)}`
}

export function formatTokenAmount(amount: bigint, decimals: number, precision = 2): string {
	return (Number(amount / 10n ** BigInt(decimals - precision)) / 10 ** precision).toFixed(precision)
}
