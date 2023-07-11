import type { DataMessage } from '$lib/stores/chat'

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
	csp: Csp
}

export type Embed = {
	message: string
	sha256: string
}

export type LoadedObject = {
	script: string
	csp: string
	name: string
	embed: Embed
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

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
	let binary = ''
	const bytes = new Uint8Array(buffer)
	const len = bytes.byteLength

	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i])
	}

	return window.btoa(binary)
}

const getEmbed = async (dataMessage: DataMessage): Promise<Embed> => {
	const message = `
		window.wakuObject = {}
		window.wakuObject.message = JSON.parse('${JSON.stringify(dataMessage)}')
	`

	const utf8 = new TextEncoder().encode(message)
	const hashBuffer = await crypto.subtle.digest('SHA-256', utf8)

	return { message, sha256: arrayBufferToBase64(hashBuffer) }
}

export const getNPMObject = async (
	module: string,
	message: DataMessage,
): Promise<LoadedObject | null> => {
	try {
		const object = (await objects[`/node_modules/${module}/object/metadata.json`]()) as WakuObject
		const script = await scripts[`/node_modules/${module}/object/index.js`]()
		const embed = await getEmbed(message)

		const added = { ...DEFAULT_CSP } as Csp
		if (!added['script-src']) {
			added['script-src'] = ''
		}
		added['script-src'] += ` 'sha256-${embed.sha256}'`

		return {
			script,
			csp: formatCsp(object.csp, added),
			name: object.name,
			embed: embed,
		}
	} catch (err) {
		console.error(err)
		return null
	}
}
