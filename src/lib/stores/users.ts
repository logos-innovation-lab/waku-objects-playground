import { writable, type Writable } from 'svelte/store'

export interface User {
	address: string
	name?: string
	avatar?: string
}

export interface ContactData {
	loading: boolean
	contacts: Map<string, User>
	error?: Error
}

export type ContactsStore = Writable<ContactData>

function createContactStore(): ContactsStore {
	const store = writable<ContactData>({ loading: true, contacts: new Map<string, User>() })

	return store
}

export const contacts = createContactStore()
