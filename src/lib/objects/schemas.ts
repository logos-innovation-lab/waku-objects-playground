import z from 'zod'

export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
export type Address = z.infer<typeof AddressSchema>

export const TokenSchema = z.object({
	name: z.string(),
	symbol: z.string(),
	amount: z.bigint().positive(),
	decimals: z.number().int().positive(),
	image: z.string().optional(),
	address: AddressSchema.optional(),
})
export type Token = z.infer<typeof TokenSchema>

export const UserSchema = z.object({
	address: AddressSchema,
	name: z.string().optional(),
	avatar: z.string().optional(),
})
export type User = z.infer<typeof UserSchema>

export const TransactionSchema = z.object({
	from: UserSchema,
	to: UserSchema,
	token: TokenSchema,
	amount: z.bigint().positive(),
	fee: z.bigint().positive(),
	txHash: z.string().optional(),
	status: z.enum(['confirmed', 'pending', 'failed']),
})
export type Transaction = z.infer<typeof TransactionSchema>

// export const WakuObjectArgsSchema = z.object({
// 	address: AddressSchema,
// 	name: z.string(),
// 	store: z.unknown(),
// 	updateStore: z
// 		.function()
// 		.args(z.function().args(z.unknown()).returns(z.unknown()))
// 		.returns(z.void()),
// 	send: z.function().args(z.unknown()).returns(z.promise(z.void())),
// 	sendTransaction: z.function().args(AddressSchema, z.string(), TokenSchema).returns(z.promise(z.string())).optional(),
// 	onViewChange: z.function().args(z.string()).returns(z.void()).optional(),
// })
