import adapter from '$lib/adapters'

// This prevents the load function from running on server
// https://kit.svelte.dev/docs/load#page-data
export const ssr = false

if (typeof adapter.start === 'function') adapter.start()
