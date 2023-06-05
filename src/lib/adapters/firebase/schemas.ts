import { AddressSchema } from '$lib/utils/schemas'
import { z } from 'zod'

export const TokenDbSchema = z.object({
	name: z.string(),
	symbol: z.string(),
	amount: z.preprocess((v) => BigInt(v as string), z.bigint().positive()),
	decimals: z.number().int().positive(),
	image: z.string(),
	address: AddressSchema.optional(),
})
export type TokenDb = z.infer<typeof TokenDbSchema>

export const UserDbSchema = z.object({
	address: AddressSchema,
	name: z.string().optional(),
	avatar: z.string().optional(),
})
export type UserDb = z.infer<typeof UserDbSchema>

export const ProfileDbSchema = z
	.object({ lastSignIn: z.number().int().positive() })
	.merge(UserDbSchema)
export type ProfileDb = z.infer<typeof ProfileDbSchema>

export const ChatDbSchema = z.object({
	messages: z.array(
		z.object({
			timestamp: z.number().int().positive(),
			text: z.string(),
			fromAddress: AddressSchema,
		}),
	),
	users: z.array(AddressSchema),
	name: z.string().optional(),
})
export type ChatDb = z.infer<typeof ChatDbSchema>
