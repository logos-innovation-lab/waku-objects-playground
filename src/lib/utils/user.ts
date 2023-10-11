import type { User } from '$lib/types'

export function userDisplayName(user?: User): string {
	return user?.name ?? user?.address.slice(0, 20) + '...' ?? ''
}
