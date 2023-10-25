import { IPFS_GATEWAY } from '$lib/adapters/ipfs'

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

export type WakuScriptType = 'chat' | 'standalone'

export type WakuFile = {
	path: string
	hash: `sha256-${string}`
}

export type WakuFiles = {
	logo: WakuFile
	chat: WakuFile
	standalone?: WakuFile
}

export type WakuObject = {
	name: string
	standalone?: boolean
	csp: Csp
	files: WakuFiles
}

export type LoadedObject = {
	script: string
	scriptIntegrity: `sha256-${string}` | null
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

export const getNPMObject = async (module: string, type: WakuScriptType) => {
	const object = (await objects[`/node_modules/${module}/object/metadata.json`]()) as WakuObject
	const script = await scripts[
		`/node_modules/${module}/object/${type === 'chat' ? 'index' : 'standalone'}.js`
	]()

	return { object, script, integrity: null }
}

export const getURLObject = async (url: string, type: WakuScriptType) => {
	const object = (await (await fetch(`${url}/metadata.json`)).json()) as WakuObject
	const file = object.files[type]

	if (!file) {
		throw new Error(`object does not include ${type} script`)
	}

	const { path, hash: integrity } = file
	return { object, script: `${url}/${path}`, integrity }
}

export const getIPFSObject = async (cid: string, type: WakuScriptType) => {
	const { object, script, integrity } = await getURLObject(`${IPFS_GATEWAY}/${cid}`, type)

	// TODO: Validate metadata.json hash

	return { object, script, integrity }
}

export const getObjectSpec = async (objectId: string, type: WakuScriptType) => {
	if (objectId.startsWith('url:')) {
		return getURLObject(objectId.substring(4), type)
	}

	if (objectId.startsWith('ipfs:')) {
		return getIPFSObject(objectId.substring(5), type)
	}

	return getNPMObject(objectId, type)
}

export const getObject = async (
	objectId: string,
	type: WakuScriptType,
): Promise<LoadedObject | null> => {
	try {
		const { object, script, integrity } = await getObjectSpec(objectId, type)

		const added = { ...DEFAULT_CSP } as Csp
		if (!added['script-src']) {
			added['script-src'] = ''
		}
		added['script-src'] += ` '${integrity}'`

		return {
			script,
			scriptIntegrity: integrity,
			csp: formatCsp(object.csp, added),
			name: object.name,
			className: type,
		}
	} catch (err) {
		// TODO: shouldn't this throw?
		console.error(err)
		return null
	}
}
