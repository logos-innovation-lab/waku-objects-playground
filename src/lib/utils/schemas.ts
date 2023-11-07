import { z } from 'zod'

export const AddressSchema = z
	.string()
	.regex(/^(0x)?[a-f0-9]{40}$/i, 'Address must be 40 hex numbers')

export const PublicKeySchema = z
	.string()
	.regex(/^(0x)?(02|03)[a-f0-9]{64}$/i, 'Public key must be 66 hex numbers')

export const TransactionHashSchema = z
	.string()
	.regex(/^(0x)?[a-f0-9]{64}$/i, 'Transaction hash must be 64 hex numbers')

export const Mnemonic12Schema = z.string().regex(/^(\w+\s){11}\w+$/i, 'Mnemonic must be 12 words')
export type Mnemonic12 = z.infer<typeof Mnemonic12Schema>
