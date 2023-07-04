import { AddressSchema } from '$lib/utils/schemas'
import z from 'zod'

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
