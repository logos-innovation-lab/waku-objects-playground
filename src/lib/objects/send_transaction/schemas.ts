import z from 'zod'
import { AddressSchema, TokenSchema, UserSchema } from '../schemas'

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

export const SendTransactionStandaloneSchema = z.object({
	view: z.string().optional(),
	tokens: z.array(TokenSchema),
	nativeToken: TokenSchema,
	fromUser: UserSchema,
	toUser: UserSchema,
})
export type SendTransactionStandalone = z.infer<typeof SendTransactionStandaloneSchema>

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
