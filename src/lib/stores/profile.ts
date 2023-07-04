import { writable, type Writable } from 'svelte/store'

export interface Profile {
	name?: string
	avatar?: string
	loading: boolean
	error?: Error
}

type ProfileStore = Writable<Profile>

function createProfileStore(): ProfileStore {
	return writable<Profile>({ loading: true })
}

export const profile = createProfileStore()
