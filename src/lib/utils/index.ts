// Note: this is not cryptographically secure
export function genRanHex(size: number) {
	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}
