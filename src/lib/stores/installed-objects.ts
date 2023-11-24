import type { StorageInstalledObject } from '$lib/adapters/waku/types'
import { writable, type Writable } from 'svelte/store'

export interface InstalledObjects {
	loading: boolean
	objects: Map<string, StorageInstalledObject>
	error?: Error
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface InstalledObjectStore extends Writable<InstalledObjects> {
	addInstalledObject: (object: StorageInstalledObject) => void
	updateInstalledObject: (
		objectId: string,
		update: (object: StorageInstalledObject) => StorageInstalledObject,
	) => void
	removeInstalledObject: (objectId: string) => void
}

function createInstalledObjects(): InstalledObjectStore {
	const store = writable<InstalledObjects>({
		loading: true,
		objects: new Map<string, StorageInstalledObject>(),
	})
	return {
		...store,
		addInstalledObject(object: StorageInstalledObject) {
			store.update((state) => {
				if (state.objects.has(object.objectId)) {
					return state
				}

				state.objects.set(object.objectId, object)

				return {
					...state,
					objects: state.objects,
				}
			})
		},
		updateInstalledObject(objectId, update) {
			store.update((state) => {
				if (!state.objects.has(objectId)) {
					return state
				}
				const oldObject = state.objects.get(objectId)
				if (!oldObject) {
					return state
				}
				const newMap = new Map(state.objects)
				const newObject = update(oldObject)
				newMap.set(objectId, newObject)

				return {
					...state,
					objects: newMap,
				}
			})
		},
		removeInstalledObject(objectId) {
			store.update((state) => {
				if (!state.objects.has(objectId)) {
					return state
				}
				state.objects.delete(objectId)

				return {
					...state,
					chats: state.objects,
				}
			})
		},
	}
}

export const installedObjectStore = createInstalledObjects()
