import adapter from '@sveltejs/adapter-auto'
import adapterStatic from '@sveltejs/adapter-static'
import preprocessor from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: preprocessor(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: process.env.STATIC
			? adapterStatic({
					// default options are shown
					pages: 'build',
					assets: 'build',
					fallback: 'index.html',
			  })
			: adapter(),
	},
}

export default config
