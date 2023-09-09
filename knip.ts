import sveltePreprocess from 'svelte-preprocess'
import { preprocess, compile } from 'svelte/compiler'
import type { KnipConfig } from 'knip'

const sveltePreprocessor = sveltePreprocess()

const config: KnipConfig = {
	ignore: [
		'**/*.d.ts',
		'**/schemas.ts',
		'src/lib/objects/hello-world/index.ts',
		'src/lib/objects/external/iframe.svelte',
		'src/lib/objects/split/types.ts',
	],
	paths: {
		// This ain't pretty, but Svelte basically does the same
		'$app/*': ['node_modules/@sveltejs/kit/src/runtime/app/*'],
		'$env/*': ['.svelte-kit/ambient.d.ts'],
		'$lib/*': ['src/lib/*'],
	},
	compilers: {
		svelte: async (text: string) => {
			const processed = await preprocess(text, sveltePreprocessor, { filename: 'dummy.ts' })
			const compiled = compile(processed.code)
			return compiled.js.code
		},
		css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
	},
	ignoreExportsUsedInFile: true,
	ignoreBinaries: ['docker'],
}

export default config
