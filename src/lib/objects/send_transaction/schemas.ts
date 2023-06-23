import z from 'zod'
import { AddressSchema, TokenSchema, UserSchema } from '../schemas'

export const SendTransactionSchema = z.object({
	token: z.string(),
	amount: z.string(),
	to: AddressSchema,
	from: AddressSchema,
	fee: z.string(),
	feeToken: z.string(),
	transactions: z.array(z.string()).optional(),
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

export const TransactionSchema = z.object({
	txHash: z.string().optional(),
	status: z.enum(['confirmed', 'pending', 'failed']),
})
export type Transaction = z.infer<typeof TransactionSchema>

export const MessageDataSendSchema = z.object({
	amount: z.string(),
	fee: z.string(),
	feeToken: z.string(),
	from: z.string(),
	to: z.string(),
	token: z.string(),
})
export type MessageDataSend = z.infer<typeof MessageDataSendSchema>
