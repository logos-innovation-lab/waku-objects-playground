import { writable, type Writable } from 'svelte/store'

export interface ObjectState {
	loading: boolean
	objects: Map<string, unknown>
	error?: Error
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ObjectStore extends Writable<ObjectState> {}

export function objectKey(objectId: string, instanceId: string): string {
	return `${objectId}/${instanceId}`
}

export function createObjectStore(): ObjectStore {
	const store = writable<ObjectState>({ loading: true, objects: new Map<string, unknown>() })
	return {
		...store,
	}
}

export const objectStore = createObjectStore()
