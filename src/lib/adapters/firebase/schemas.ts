import { z } from 'zod'

const address = z.string().regex(/^(0x)?[a-f0-9]{40}$/i, 'Address must be 40 hex numbers')

export const UserDbSchema = z.object({
	address,
	name: z.string().optional(),
	avatar: z.string().optional(),
})

export const ChatDbSchema = z.object({
	messages: z.array(
		z.object({
			timestamp: z.number().int().positive(),
			text: z.string(),
			fromAddress: address,
		}),
	),
	users: z.array(address),
	name: z.string().optional(),
})
