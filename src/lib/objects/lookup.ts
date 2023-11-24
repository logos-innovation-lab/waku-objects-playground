import type { WakuObjectSvelteDescriptor } from '.'
import { getExternalDescriptor } from './external'
import { helloWorldDescriptor } from './hello-world'
import { payggyDescriptor } from './payggy'
import sandboxLogo from '@waku-objects/sandbox-example/object/logo.svg'
import sandboxMeta from '@waku-objects/sandbox-example/object/metadata.json'
import { splitDescriptor } from './split'
import { installedObjectStore } from '$lib/stores/installed-objects'
import { get } from 'svelte/store'

export type InstalledObjectDescriptor = WakuObjectSvelteDescriptor & {
	preInstalled: boolean
	installed: boolean
}

const preInstalledObjectList: WakuObjectSvelteDescriptor[] = [
	helloWorldDescriptor,
	payggyDescriptor,
	splitDescriptor as unknown as WakuObjectSvelteDescriptor, // FIXME: this is quite uggly
	getExternalDescriptor(
		'@waku-objects/sandbox-example',
		sandboxMeta.name,
		sandboxMeta.description,
		sandboxLogo,
	),
]

export function lookup(objectId: string): InstalledObjectDescriptor | undefined {
	const installedObjectList = getInstalledObjectList()
	return installedObjectList.find((object) => object.objectId === objectId)
}

export function getInstalledObjectList(): InstalledObjectDescriptor[] {
	const installedObjectList = Array.from(get(installedObjectStore).objects).map((item) => {
		const object = item[1]
		return {
			...getExternalDescriptor(object.objectId, object.name, object.description, object.logo),
			preInstalled: false,
			installed: object.installed,
		}
	})
	return preInstalledObjectList
		.map((object) => ({
			...object,
			preInstalled: true,
			installed: true,
		}))
		.concat(installedObjectList)
}
