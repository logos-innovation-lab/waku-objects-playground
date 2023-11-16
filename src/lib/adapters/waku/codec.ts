import {
	createEncoder as createWakuSymmetricEncoder,
	createDecoder as createWakuSymmetricDecoder,
} from '@waku/message-encryption/symmetric'
import {
	createEncoder as createWakuEciesEncoder,
	createDecoder as createWakuEciesDecoder,
} from '@waku/message-encryption/ecies'
import { getTopic, type ContentTopic } from './waku'
import { bytesToHex, hexToBytes } from '@waku/utils/bytes'
import { type Hex, fixHex, uncompressPublicKey, privateKeyToPublicKey } from './crypto'

function toHex(value: Uint8Array | Hex): Hex {
	return typeof value === 'string' ? fixHex(value) : bytesToHex(value)
}

export function createSymmetricEncoder(options: {
	contentTopic: ContentTopic
	symKey: Uint8Array | Hex
	sigPrivKey?: Uint8Array | Hex
}) {
	const contentTopic = getTopic(options.contentTopic, toHex(options.symKey))
	return createWakuSymmetricEncoder({
		...options,
		contentTopic,
		symKey: hexToBytes(options.symKey),
		sigPrivKey: options.sigPrivKey ? hexToBytes(options.sigPrivKey) : undefined,
	})
}

export function createSymmetricDecoder(options: {
	contentTopic: ContentTopic
	symKey: Uint8Array | Hex
}) {
	const contentTopic = getTopic(options.contentTopic, toHex(options.symKey))
	return createWakuSymmetricDecoder(contentTopic, hexToBytes(options.symKey))
}

export function createEciesEncoder(options: {
	contentTopic: ContentTopic
	publicKey: Uint8Array | Hex
	sigPrivKey?: Uint8Array | Hex
}) {
	const contentTopic = getTopic(options.contentTopic, toHex(options.publicKey))
	return createWakuEciesEncoder({
		...options,
		contentTopic,
		publicKey: hexToBytes(uncompressPublicKey(options.publicKey)),
		sigPrivKey: options.sigPrivKey ? hexToBytes(options.sigPrivKey) : undefined,
	})
}

export function createEciesDecoder(options: {
	contentTopic: ContentTopic
	privateKey: Uint8Array | Hex
}) {
	const publicKey = privateKeyToPublicKey(options.privateKey)
	const contentTopic = getTopic(options.contentTopic, toHex(publicKey))
	return createWakuEciesDecoder(contentTopic, hexToBytes(options.privateKey))
}
