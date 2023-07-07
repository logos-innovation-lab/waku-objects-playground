import z from 'zod'
import { TokenSchema, UserSchema } from '../schemas'
import { AddressSchema, TransactionHashSchema } from '$lib/utils/schemas'

export const SendTransactionSchema = z.object({
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
export type SendTransaction = z.infer<typeof SendTransactionSchema>

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
export type Transaction = z.infer<typeof SendTransactionSchema>

export const SendTransactionStandaloneSchema = z.object({
	view: z.string().optional(),
	tokens: z.array(TokenSchema),
	nativeToken: TokenSchema,
	fromUser: UserSchema,
	toUser: UserSchema,
})
export type SendTransactionStandalone = z.infer<typeof SendTransactionStandaloneSchema>

export const SendTransactionStoreSchema = z.union([
	z.object({
		type: z.literal('init'),
	}),
	z.object({
		type: z.literal('pending'),
		transaction: TransactionSchema,
		hash: TransactionHashSchema,
	}),
	z.object({
		type: z.literal('complete'),
		transaction: TransactionSchema,
		hash: TransactionHashSchema,
	}),
])
export type SendTransactionStore = z.infer<typeof SendTransactionStoreSchema>

export const MessageDataSendSchema = z.object({
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
	tx: z.string(),
})
export type MessageDataSend = z.infer<typeof MessageDataSendSchema>
