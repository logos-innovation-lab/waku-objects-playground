import { goto } from '$app/navigation'
import adapters from '$lib/adapters'
import routes from '$lib/routes'
import { profile } from '$lib/stores/profile'
import type { PageLoad } from './$types'

// This prevents the load function from running on server
// https://kit.svelte.dev/docs/load#page-data
export const ssr = false

export const load = (async () => {
	const promise = new Promise<void>((resolve) => {
		let unsubscribe: (() => void) | undefined = undefined
		unsubscribe = profile.subscribe((p) => {
			if (p.loading) return

			if (unsubscribe) unsubscribe()

			// If user is not logged in, redirect to home page
			if (!p.address) {
				goto(routes.HOME)
			}
			resolve()
		})
	})

	await promise

	return {
		mnemonics: adapters.getMnemonics(),
	}
}) satisfies PageLoad
