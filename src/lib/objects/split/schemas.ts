import z from 'zod'
import { AddressSchema } from '$lib/utils/schemas'

const ExpenseSchema = z.object({
	txHash: z.string(), // Adding any expense means transaction, it is also used as ID of the expense
	amount: z.string(),
	decimals: z.number().int().positive(),
	description: z.string(),
	images: z.array(z.string()),
	paidBy: AddressSchema,
	timestamp: z.number(),
})
export type Expense = z.infer<typeof ExpenseSchema>

export const PaymentSchema = z.object({
	txHash: z.string(),
	amount: z.string(),
	decimals: z.number().int().positive(),
	paidBy: AddressSchema,
	timestamp: z.number(),
})
export type Payment = z.infer<typeof PaymentSchema>

export const BalanceSchema = z.object({
	address: AddressSchema,
	amount: z.string(),
	decimals: z.number().int().positive(),
})
export type Balance = z.infer<typeof BalanceSchema>

export const StoreSchema = z.object({
	splitterAddress: z.string(),
	balances: z.array(BalanceSchema),
	payments: z.array(PaymentSchema),
	expenses: z.array(ExpenseSchema),
})
export type Store = z.infer<typeof StoreSchema>

export const DataMessageSchema = z.union([
	z.object({
		type: z.literal('expense'),
		splitterAddress: z.string(),
		expense: ExpenseSchema,
		users: z.array(AddressSchema),
	}),
	z.object({
		type: z.literal('settle-reminder'),
	}),
	z.object({
		type: z.literal('payment'),
		splitterAddress: z.string(),
		payment: PaymentSchema,
	}),
])
export type DataMessage = z.infer<typeof DataMessageSchema>
