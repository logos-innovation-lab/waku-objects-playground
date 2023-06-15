export interface WakuObjectArgs {
	address: string
	name: string
	store: unknown
	send: (data: unknown) => Promise<void>
}
