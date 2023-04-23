import { writable, type Writable } from 'svelte/store'

export interface Profile {
	address?: string
	name?: string
	avatar?: string
}

export type ProfileStore = Writable<Profile>

function createProfileStore(): ProfileStore {
	return writable<Profile>({})
}

export const profile = createProfileStore()
