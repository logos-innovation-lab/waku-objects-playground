import type { JSONSerializable } from '$lib/objects'
import { writable, type Writable } from 'svelte/store'

export interface ObjectState {
	loading: boolean
	lastUpdated: number
	objects: Map<string, JSONSerializable>
	error?: Error
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ObjectStore extends Writable<ObjectState> {}

export function objectKey(objectId: string, instanceId: string): string {
	return `${objectId}:${instanceId}`
}

function createObjectStore(): ObjectStore {
	const store = writable<ObjectState>({
		loading: true,
		objects: new Map<string, JSONSerializable>(),
		lastUpdated: 0,
	})
	return {
		...store,
	}
}

export const objectStore = createObjectStore()
