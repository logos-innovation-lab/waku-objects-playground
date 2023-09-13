import { AddressSchema } from '$lib/utils/schemas'
import z from 'zod'

export const TokenNoAmountSchema = z.object({
	name: z.string(),
	symbol: z.string(),
	decimals: z.number().int().positive(),
	image: z.string().optional(),
	address: AddressSchema.optional(),
})
export type TokenNoAmount = z.infer<typeof TokenNoAmountSchema>

export const TokenSchema = TokenNoAmountSchema.extend({
	amount: z.bigint().positive(),
})
export type Token = z.infer<typeof TokenSchema>

export const UserSchema = z.object({
	address: AddressSchema,
	name: z.string().optional(),
	avatar: z.string().optional(),
})
export type User = z.infer<typeof UserSchema>

export const TransactionSchema = z.object({
	timestamp: z.number().int().positive(),
	hash: z.string(),
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

export const TransactionStateSchema = z.enum(['unknown', 'pending', 'reverted', 'success'])
export type TransactionState = z.infer<typeof TransactionStateSchema>
