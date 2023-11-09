import {
	getSharedSecret as nobleGetSharedSecret,
	ProjectivePoint,
	getPublicKey,
} from '@noble/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'
import { bytesToHex, hexToBytes } from '@waku/utils/bytes'
import { gcm } from '@noble/ciphers/aes'
import { randomBytes } from '@noble/ciphers/webcrypto/utils'

export type Hex = string

export function fixHex(h: Hex): Hex {
	if (h.startsWith('0x')) {
		return h.slice(2)
	}
	return h
}

export function getSharedSecret(privateKey: Hex, publicKey: Hex): Hex {
	const secretBytes = nobleGetSharedSecret(fixHex(privateKey), fixHex(publicKey), true)
	return hash(secretBytes.slice(1))
}

export function hash(data: Uint8Array | Hex): Hex {
	const bytes = typeof data === 'string' ? hexToBytes(data) : data
	const hashBytes = keccak_256(bytes)
	return bytesToHex(hashBytes)
}

export function encrypt(
	plaintext: Uint8Array,
	key: Uint8Array,
	nonce: Uint8Array = randomBytes(24),
): Uint8Array {
	const aes = gcm(key, nonce)
	const ciphertext = aes.encrypt(plaintext)
	return new Uint8Array([...nonce, ...ciphertext])
}

export function decrypt(encrypted: Uint8Array, key: Uint8Array): Uint8Array {
	const nonce = encrypted.slice(0, 24)
	const ciphertext = encrypted.slice(24)
	const aes = gcm(key, nonce)
	const plaintext = aes.decrypt(ciphertext)
	return plaintext
}

export function publicKeyToAddress(publicKey: Hex): Hex {
	const uncompressedPublicKey = ProjectivePoint.fromHex(fixHex(publicKey)).toRawBytes(false)
	const keyHash = hash(uncompressedPublicKey.slice(1))
	return '0x' + keyHash.slice(-40)
}

export function compressPublicKey(publicKey: Hex | Uint8Array): Hex {
	publicKey = typeof publicKey === 'string' ? fixHex(publicKey) : bytesToHex(publicKey)
	return ProjectivePoint.fromHex(publicKey).toHex(true)
}

export function privateKeyToPublicKey(privateKey: Hex | Uint8Array): Hex {
	const privateKeyHex = typeof privateKey === 'string' ? fixHex(privateKey) : bytesToHex(privateKey)
	const publicKeyBytes = getPublicKey(privateKeyHex)
	return bytesToHex(publicKeyBytes)
}
