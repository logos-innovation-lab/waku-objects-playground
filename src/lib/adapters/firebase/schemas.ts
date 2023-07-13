import { AddressSchema } from '$lib/utils/schemas'
import { z } from 'zod'

export const UserDbSchema = z.object({
	address: AddressSchema,
	name: z.string().optional(),
	avatar: z.string().optional(),
})
const ProfileDbSchema = z.object({ lastSignIn: z.number().int().positive() }).merge(UserDbSchema)
export type ProfileDb = z.infer<typeof ProfileDbSchema>

export const ChatDbSchema = z.object({
	messages: z.array(
		z.union([
			z.object({
				type: z.literal('user'),
				timestamp: z.number().int().positive(),
				text: z.string(),
				fromAddress: AddressSchema,
			}),
			z.object({
				type: z.literal('data'),
				timestamp: z.number().int().positive(),
				fromAddress: AddressSchema,
				objectId: z.string(),
				instanceId: z.string(),
				data: z.unknown(),
			}),
		]),
	),
	users: z.array(AddressSchema),
	name: z.string().optional(),
})

export const ObjectDbSchema = z.unknown()
