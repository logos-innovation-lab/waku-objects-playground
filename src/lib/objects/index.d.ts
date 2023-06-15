export interface WakuObjectArgs {
	readonly address: string
	readonly name: string

	readonly store: unknown
	updateStore: (updater: (state: unknown) => unknown) => void

	send: (data: unknown) => Promise<void>
}
