import { goto } from '$app/navigation'
import routes from '$lib/routes'
import { errorStore } from '$lib/stores/error'
import { walletStore } from '$lib/stores/wallet'

// This prevents the load function from running on server
// https://kit.svelte.dev/docs/load#page-data
export const ssr = false

export async function load() {
	const promise = new Promise<void>((resolve) => {
		let unsubscribe: (() => void) | undefined = undefined
		unsubscribe = walletStore.subscribe((w) => {
			if (w.loading) return

			if (unsubscribe) unsubscribe()

			if (w.wallet) {
				// Already have account, redirecting to home page
				goto(routes.HOME)
			}
			resolve()
		})
	})

	try {
		await promise
	} catch (error) {
		errorStore.addEnd({
			title: 'Account error',
			message: `Failed to load account. ${(error as Error).message}`,
			retry: load,
			ok: true,
		})
	}
}
