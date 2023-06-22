import type { WakuObjectDescriptor } from '.'
import { HELLO_WORLD_OBJECT_ID, helloWorldDescriptor } from './hello-world'

const wakuObjectMap: Map<string, WakuObjectDescriptor> = new Map([
	[HELLO_WORLD_OBJECT_ID, helloWorldDescriptor],
])

export function lookup(objectId: string): WakuObjectDescriptor | undefined {
	return wakuObjectMap.get(objectId)
}
