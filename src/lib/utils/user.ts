import { publicKeyToAddress } from '$lib/adapters/waku/crypto'
import type { User } from '$lib/types'

export function userDisplayName(user?: User): string {
	return (
		user?.name ??
		(user?.publicKey && publicKeyToAddress(user?.publicKey).slice(0, 20) + '...') ??
		''
	)
}
