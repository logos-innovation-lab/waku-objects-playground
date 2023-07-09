export function throwError(e: unknown): never {
	console.error({ e })
	throw e
}
