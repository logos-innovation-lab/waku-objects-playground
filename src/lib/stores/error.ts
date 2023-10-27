import type { ComponentType } from 'svelte'
import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

interface Action {
	icon: ComponentType
	variant?: 'strong'
	label: string
	handler: () => Promise<void> | void
}

export interface ErrorDescriptor {
	title: string
	message: string
	ok?: boolean
	reload?: boolean
	retry?: () => Promise<void> | void
	actions?: Action[]
}

type ErrorState = ErrorDescriptor[]

interface ErrorStore extends Writable<ErrorState> {
	addStart: (error: ErrorDescriptor) => void
	addEnd: (error: ErrorDescriptor) => void
	resolve: (error: ErrorDescriptor) => void
}

function createErrorStore(): ErrorStore {
	const store = writable<ErrorState>([])

	const addStart = (error: ErrorDescriptor) => {
		store.update((errors) => [error, ...errors])
	}
	const addEnd = (error: ErrorDescriptor) => {
		store.update((errors) => [...errors, error])
	}

	const resolve = (error: ErrorDescriptor) => {
		store.update((errors) => errors.filter((e) => e !== error))
	}

	return { ...store, addStart, addEnd, resolve }
}

export const errorStore = createErrorStore()
