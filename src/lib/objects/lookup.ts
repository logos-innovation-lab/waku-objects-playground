import type { WakuObjectSvelteDescriptor } from '.'
import { getExternalDescriptor } from './external'
import { helloWorldDescriptor } from './hello-world'
import { payggyDescriptor } from './payggy'
import sandboxLogo from '@waku-objects/sandbox-example/object/logo.svg'
import sandboxMeta from '@waku-objects/sandbox-example/object/metadata.json'
import { splitDescriptor } from './split'

export const wakuObjectList: WakuObjectSvelteDescriptor[] = [
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

const wakuObjectMap: Map<string, WakuObjectSvelteDescriptor> = new Map(
	wakuObjectList.map((wakuObject) => [wakuObject.objectId, wakuObject]),
)

export function lookup(objectId: string): WakuObjectSvelteDescriptor | undefined {
	return wakuObjectMap.get(objectId)
}
