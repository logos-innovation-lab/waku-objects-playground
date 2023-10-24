import type { StorageInstalledObject } from '$lib/adapters/waku/types'
import { writable, type Writable } from 'svelte/store'

export interface InstalledObjects {
	loading: boolean
	objects: Map<string, StorageInstalledObject>
	error?: Error
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface InstalledObjectStore extends Writable<InstalledObjects> {}

function createInstalledObjects(): InstalledObjectStore {
	const store = writable<InstalledObjects>({
		loading: true,
		objects: new Map<string, StorageInstalledObject>(),
	})
	return {
		...store,
	}
}

export const installedObjectStore = createInstalledObjects()
