import {
	createLightNode,
	waitForRemotePeer,
	utf8ToBytes,
	bytesToUtf8,
	type DecodedMessage,
} from '@waku/sdk'
import { multiaddr } from '@multiformats/multiaddr'
import {
	type LightNode,
	Protocols,
	type Callback,
	type StoreQueryOptions,
	type Unsubscribe,
} from '@waku/interfaces'
import { PUBLIC_WAKU } from '$env/static/public'
import { createDecoder, createEncoder } from '@waku/message-encryption/symmetric'
import { hash } from './crypto'

function getPeers(): string[] {
	switch (PUBLIC_WAKU) {
		// Local version in docker
		case 'local':
			return [
				'/ip4/127.0.0.1/tcp/8000/ws/p2p/16Uiu2HAm53sojJN72rFbYg6GV2LpRRER9XeWkiEAhjKy3aL9cN5Z',
			]

		// Defaults to production
		case 'production':
		default:
			return [
				'/dns4/ws.waku.apyos.dev/tcp/8123/wss/p2p/16Uiu2HAkzy7Apy2H72WYx3cSdPFqmeLThHTi8EY2KN22rpKHZ4gM ',
			]
	}
}

const peers = getPeers()

export type ContentTopic =
	| 'private-message'
	| 'profile'
	| 'chats'
	| 'objects'
	| 'group-chats'
	| 'installed'
	| 'invites'

export type QueryResult = AsyncGenerator<Promise<DecodedMessage | undefined>[]>

const topicApp = 'wakuobjects-playground'
const topicVersion = '1'

function getTopic(contentTopic: ContentTopic, id: string | '' = '') {
	return hash(new TextEncoder().encode(`/${topicApp}/${topicVersion}/${contentTopic}/${id}`))
}

export interface ConnectWakuOptions {
	onDisconnect?: () => void
	onConnect?: (connections: unknown[]) => void
}

export async function connectWaku(options?: ConnectWakuOptions) {
	const waku = await createLightNode({ pingKeepAlive: 60 })

	waku.libp2p.addEventListener('peer:disconnect', () => {
		if (options?.onDisconnect && waku.libp2p.getConnections().length === 0) {
			options.onDisconnect()
		}
	})

	waku.libp2p.addEventListener('peer:connect', () => {
		if (options?.onConnect && waku.libp2p.getConnections().length > 0) {
			const connections = waku.libp2p.getConnections()
			options.onConnect(connections)
		}
	})

	await waku.start()
	for (const peer of peers) {
		const addr = multiaddr(peer)
		await waku.dial(addr)
	}
	await waitForRemotePeer(waku, [Protocols.Filter, Protocols.LightPush, Protocols.Store])

	return waku
}

export async function subscribe(
	waku: LightNode,
	contentTopic: ContentTopic,
	symKey: Uint8Array,
	callback: Callback<DecodedMessage>,
): Promise<Unsubscribe> {
	const topicKey = hash(symKey)
	const messageDecoder = createDecoder(getTopic(contentTopic, topicKey), symKey)
	const unsubscribe = await waku.filter.subscribe([messageDecoder], callback)

	return unsubscribe
}

export async function storeDocument(
	waku: LightNode,
	contentTopicName: ContentTopic,
	symKey: Uint8Array,
	document: unknown,
) {
	const topicKey = hash(symKey)
	const contentTopic = getTopic(contentTopicName, topicKey)
	const encoder = createEncoder({ contentTopic, symKey })
	const json = JSON.stringify(document)
	const payload = utf8ToBytes(json)

	const sendResult = await waku.lightPush.send(encoder, { payload })
	if (sendResult.errors && sendResult.errors.length > 0) {
		return sendResult.errors
	}
}

export async function readStore(
	waku: LightNode,
	contentTopic: ContentTopic,
	symKey: Uint8Array,
	storeQueryOptions?: StoreQueryOptions,
): Promise<QueryResult> {
	const topicKey = hash(symKey)
	const topic = getTopic(contentTopic, topicKey)
	const decoder = createDecoder(topic, symKey)

	return waku.store.queryGenerator([decoder], storeQueryOptions)
}

export function decodeMessagePayload(wakuMessage: DecodedMessage): string {
	return bytesToUtf8(wakuMessage.payload)
}

export async function sendMessage(waku: LightNode, symKey: Uint8Array, message: unknown) {
	const json = JSON.stringify(message)
	const payload = utf8ToBytes(json)
	const topicKey = hash(symKey)
	const contentTopic = getTopic('private-message', topicKey)
	const encoder = createEncoder({ contentTopic, symKey })

	const sendResult = await waku.lightPush.send(encoder, { payload })
	if (sendResult.errors && sendResult.errors.length > 0) {
		return sendResult.errors
	}
}
