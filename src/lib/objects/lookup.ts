import type { WakuObjectDescriptor } from '.'
import { getExternalDescriptor } from './external'
import { helloWorldDescriptor } from './hello-world'
import { payggyDescriptor } from './payggy'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const wakuObjectList: WakuObjectDescriptor<any, any>[] = [
	helloWorldDescriptor,
	payggyDescriptor,
	getExternalDescriptor('@waku-objects/sandbox-example'),
]

const wakuObjectMap: Map<string, WakuObjectDescriptor> = new Map(
	wakuObjectList.map((wakuObject) => [wakuObject.objectId, wakuObject]),
)

export function lookup(objectId: string): WakuObjectDescriptor | undefined {
	return wakuObjectMap.get(objectId)
}
