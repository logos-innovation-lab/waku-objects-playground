import { z } from 'zod'

export const AddressSchema = z
	.string()
	.regex(/^(0x)?[a-f0-9]{40}$/i, 'Address must be 40 hex numbers')

export const Mnemonic12Schema = z.string().regex(/^(\w+\s){11}\w+$/i, 'Mnemonic must be 12 words')
export type Mnemonic12 = z.infer<typeof Mnemonic12Schema>
