import type { WakuObjectSvelteDescriptor } from '.'
import { getExternalDescriptor } from './external'
import { helloWorldDescriptor } from './hello-world'
import { payggyDescriptor } from './payggy'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const wakuObjectList: WakuObjectSvelteDescriptor[] = [
	helloWorldDescriptor,
	payggyDescriptor,
	getExternalDescriptor('@waku-objects/sandbox-example'),
]

const wakuObjectMap: Map<string, WakuObjectSvelteDescriptor> = new Map(
	wakuObjectList.map((wakuObject) => [wakuObject.objectId, wakuObject]),
)

export function lookup(objectId: string): WakuObjectSvelteDescriptor | undefined {
	return wakuObjectMap.get(objectId)
}
