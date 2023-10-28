// Note: this is not cryptographically secure
export function genRandomHex(size: number) {
	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}

const numberRegex = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/

export function isValidNumber(input: string): boolean {
	return numberRegex.test(input)
}
