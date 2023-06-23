import type { WakuObjectDescriptor } from '.'
import { HELLO_WORLD_OBJECT_ID, helloWorldDescriptor } from './hello-world'
import { SEND_TRANSACTION_OBJECT_ID, sendTransactionDescriptor } from './send_transaction'

const wakuObjectMap: Map<string, WakuObjectDescriptor> = new Map([
	[HELLO_WORLD_OBJECT_ID, helloWorldDescriptor],
	[SEND_TRANSACTION_OBJECT_ID, sendTransactionDescriptor],
])

export function lookup(objectId: string): WakuObjectDescriptor | undefined {
	return wakuObjectMap.get(objectId)
}
