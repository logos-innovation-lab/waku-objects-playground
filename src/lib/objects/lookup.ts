import type { WakuObjectSvelteDescriptor } from '.'
import { getExternalDescriptor } from './external'
import { helloWorldDescriptor } from './hello-world'
import { payggyDescriptor } from './payggy'
import sandboxLogo from '@waku-objects/sandbox-example/object/logo.svg'
import sandboxMeta from '@waku-objects/sandbox-example/object/metadata.json'
import { splitDescriptor } from './split'
import { installedObjectStore } from '$lib/stores/installed-objects'
import { get } from 'svelte/store'

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

export function lookup(objectId: string): WakuObjectSvelteDescriptor | undefined {
	const installedObjectList = getInstalledObjectList()
	return installedObjectList.find((object) => object.objectId === objectId)
}

export function getInstalledObjectList() {
	const installedObjectList = Array.from(get(installedObjectStore).objects)
		.map((item) => item[1])
		.map((object) =>
			getExternalDescriptor(object.objectId, object.name, object.description, object.logo),
		)
	return preInstalledObjectList.concat(installedObjectList)
}
