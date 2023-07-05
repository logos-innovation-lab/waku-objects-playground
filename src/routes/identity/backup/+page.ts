import { goto } from '$app/navigation'
import routes from '$lib/routes'
import { walletStore } from '$lib/stores/wallet'

// This prevents the load function from running on server
// https://kit.svelte.dev/docs/load#page-data
export const ssr = false

export const load = async () => {
	const promise = new Promise<void>((resolve) => {
		let unsubscribe: (() => void) | undefined = undefined
		unsubscribe = walletStore.subscribe((p) => {
			if (p.loading) return

			if (unsubscribe) unsubscribe()

			// If user is not logged in, redirect to home page
			if (!p.wallet) {
				goto(routes.HOME)
			}
			resolve()
		})
	})

	await promise

	return {
		mnemonics: walletStore.getMnemonics(),
	}
}
