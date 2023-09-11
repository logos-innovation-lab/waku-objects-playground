// Not sure how inefficient this is
const scripts = import.meta.glob('/node_modules/**/object/index.js', {
	as: 'url',
})
const objects = import.meta.glob('/node_modules/**/object/metadata.json', {
	import: 'default',
})

// Types
export type Csp = {
	'script-src'?: string
	'connect-src'?: string
	'object-src'?: string
	'base-uri'?: string
}

export type WakuObject = {
	name: string
	standalone?: boolean
	csp: Csp
}

export type LoadedObject = {
	script: string
	csp: string
	name: string
	className: string
}

const DEFAULT_CSP: Csp = {
	'script-src': "'sha256-8ZA4erewoueW8qDjQqvIJfkb2humUQAuHQchuXcCUSA='",
}

// Functions
const formatCsp = (csp: Csp, add?: Csp): string => {
	// TODO: Clean added csp part up
	return Object.entries(csp)
		.map(([key, value]) => {
			return `${key} ${value}${add?.[key as keyof Csp] ? ' ' + add?.[key as keyof Csp] : ''}`
		})
		.join('; ')
}

export const getNPMObject = async (
	module: string,
	className: 'chat' | 'standalone',
): Promise<LoadedObject | null> => {
	try {
		const object = (await objects[`/node_modules/${module}/object/metadata.json`]()) as WakuObject
		const script = await scripts[`/node_modules/${module}/object/index.js`]()

		const added = { ...DEFAULT_CSP } as Csp
		if (!added['script-src']) {
			added['script-src'] = ''
		}

		return {
			script,
			csp: formatCsp(object.csp, added),
			name: object.name,
			className,
		}
	} catch (err) {
		console.error(err)
		return null
	}
}
