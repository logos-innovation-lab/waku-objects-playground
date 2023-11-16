import type { DecodedMessage } from '@waku/sdk'
import { sha256, type Hex } from './crypto'
import { hexToBytes } from '@waku/utils/bytes'

export const DEFAULT_PUBSUB_TOPIC = '/waku/2/default-waku/proto'

/**
 * Message hashing according to https://rfc.vac.dev/spec/14/#version1
 *
 * @param decodedMessage    the decoded message
 * @param pubsubTopic       the pubsub topic
 * @returns                 the hash as hex string with 0x prefix
 */
export function hashDecodedMessage(
	decodedMessage: DecodedMessage,
	pubsubTopic: string = DEFAULT_PUBSUB_TOPIC,
): Hex {
	return hashMessage(
		decodedMessage.payload,
		decodedMessage.contentTopic,
		decodedMessage.meta,
		pubsubTopic,
	)
}

/**
 * Message hashing according to https://rfc.vac.dev/spec/14/#version1
 *
 * @param payload           payload of the message
 * @param contentTopic      contentTopic of the message
 * @param meta              meta of the message
 * @param pubsubTopic       the pubsub topic
 * @returns                 the hash as hex string with 0x prefix
 */
export function hashMessage(
	payload: Hex | Uint8Array,
	contentTopic: string,
	meta?: Hex | Uint8Array | undefined,
	pubsubTopic: string = DEFAULT_PUBSUB_TOPIC,
) {
	const payloadBytes = hexToBytes(payload)
	const contentTopicBytes = new TextEncoder().encode(contentTopic)
	const metaBytes = meta ? hexToBytes(meta) : new Uint8Array()
	const pubsubTopicBytes = new TextEncoder().encode(pubsubTopic)

	return (
		'0x' +
		sha256(
			new Uint8Array([...pubsubTopicBytes, ...payloadBytes, ...contentTopicBytes, ...metaBytes]),
		)
	)
}
