import type { WakuObjectDescriptor } from '.'
import { HELLO_WORLD_OBJECT_ID, helloWorldDescriptor } from './hello-world'
import { PAYGGY_OBJECT_ID, sendTransactionDescriptor } from './payggy'

const wakuObjectMap: Map<string, WakuObjectDescriptor> = new Map([
	[HELLO_WORLD_OBJECT_ID, helloWorldDescriptor],
	[PAYGGY_OBJECT_ID, sendTransactionDescriptor],
])

export function lookup(objectId: string): WakuObjectDescriptor | undefined {
	return wakuObjectMap.get(objectId)
}
