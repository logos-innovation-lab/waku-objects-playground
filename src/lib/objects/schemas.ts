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

export const TransactionSchema = z.object({
	token: z.object({
		amount: z.string(),
		symbol: z.string(),
		decimals: z.number().int().positive(),
	}),
	to: AddressSchema,
	from: AddressSchema,
	fee: z.object({
		amount: z.string(),
		symbol: z.string(),
		decimals: z.number().int().positive(),
	}),
})
export type Transaction = z.infer<typeof TransactionSchema>

export const TransactionStateSchema = z.union([
	z.literal('unknown'),
	z.literal('pending'),
	z.literal('reverted'),
	z.literal('success'),
])
export type TransactionState = z.infer<typeof TransactionStateSchema>
