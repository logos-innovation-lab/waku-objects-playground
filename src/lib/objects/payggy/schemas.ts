import z from 'zod'
import { TransactionSchema } from '../schemas'
import { TransactionHashSchema } from '$lib/utils/schemas'

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
		type: z.literal('success'),
		transaction: TransactionSchema,
		hash: TransactionHashSchema,
	}),
	z.object({
		type: z.literal('error'),
		transaction: TransactionSchema,
		error: z.string(),
	}),
])
export type SendTransactionStore = z.infer<typeof SendTransactionStoreSchema>

export const SendTransactionDataMessageSchema = z.object({
	hash: TransactionHashSchema,
})
export type SendTransactionDataMessage = z.infer<typeof SendTransactionDataMessageSchema>
