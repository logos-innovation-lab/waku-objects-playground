import { writable, type Writable } from 'svelte/store'

export interface Profile {
	address?: string
	name?: string
	avatar?: string
	loading: boolean
	error?: Error
}

export type ProfileStore = Writable<Profile>

function createProfileStore(): ProfileStore {
	return writable<Profile>({ loading: true })
}

export const profile = createProfileStore()
