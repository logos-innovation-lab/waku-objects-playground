import z from 'zod'
import { AddressSchema } from '$lib/utils/schemas'
import { TokenSchema } from '../schemas'

const ExpenseSchema = z.object({
	txHash: z.string(), // Adding any expense means transaction, it is also used as ID of the expense
	amount: z.string(),
	description: z.string(),
	images: z.array(z.string()),
	paidBy: AddressSchema,
	timestamp: z.number(),
})
export type Expense = z.infer<typeof ExpenseSchema>

export const PaymentSchema = z.object({
	txHash: z.string(),
	amount: z.string(),
	paidBy: AddressSchema,
	timestamp: z.number(),
})
export type Payment = z.infer<typeof PaymentSchema>

export const BalanceSchema = z.object({
	address: AddressSchema,
	amount: z.string(),
})
export type Balance = z.infer<typeof BalanceSchema>

export const StoreSchema = z.object({
	splitterAddress: z.string(),
	token: TokenSchema,
	collectionName: z.string(),
	users: z.array(AddressSchema),
	balances: z.array(BalanceSchema),
	payments: z.array(PaymentSchema),
	expenses: z.array(ExpenseSchema),
})
export type Store = z.infer<typeof StoreSchema>

export const DataMessageSchema = z.union([
	z.object({
		type: z.literal('expense'),
		splitterAddress: z.string(),
		tokenAddress: z.string().optional(),
		collectionName: z.string().optional(),
		expense: ExpenseSchema,
		users: z.array(AddressSchema),
	}),
	z.object({
		type: z.literal('settle-reminder'),
	}),
	z.object({
		type: z.literal('payment'),
		splitterAddress: z.string(),
		tokenAddress: z.string().optional(),
		payment: PaymentSchema,
	}),
])
export type DataMessage = z.infer<typeof DataMessageSchema>
