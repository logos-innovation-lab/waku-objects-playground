import { createLightNode, waitForRemotePeer, utf8ToBytes, bytesToUtf8 } from '@waku/sdk'
import { multiaddr } from '@multiformats/multiaddr'
import {
	type LightNode,
	Protocols,
	type Callback,
	type StoreQueryOptions,
	type Unsubscribe,
	type IEncoder,
	type IDecoder,
} from '@waku/interfaces'
import { PUBLIC_WAKU } from '$env/static/public'
import type { DecodedMessage } from '@waku/message-encryption'
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
				'/dns4/waku.gra.nomad.apyos.dev/tcp/443/wss/p2p/16Uiu2HAmDvywnsGaB32tFqwjTsg8sfC1ZV2EXo3xjxM4V2gvH6Up',
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

export function getTopic(contentTopic: ContentTopic, id: string | '' = '') {
	const topicApp = 'wakuplay.im'
	const topicVersion = '1'
	const topicEncoding = 'json'

	const hashedContentTopicName = hash(new TextEncoder().encode(`${contentTopic}/${id}`))
	return `/${topicApp}/${topicVersion}/${hashedContentTopicName}/${topicEncoding}`
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
	decoder: IDecoder<DecodedMessage>,
	callback: Callback<DecodedMessage>,
): Promise<Unsubscribe> {
	const unsubscribe = await waku.filter.subscribe([decoder], callback)

	return unsubscribe
}

export async function storeDocument(waku: LightNode, encoder: IEncoder, document: unknown) {
	const json = JSON.stringify(document)
	const payload = utf8ToBytes(json)

	const sendResult = await waku.lightPush.send(encoder, { payload })
	if (sendResult.errors && sendResult.errors.length > 0) {
		return sendResult.errors
	}
}

export async function readStore(
	waku: LightNode,
	decoder: IDecoder<DecodedMessage>,
	storeQueryOptions?: StoreQueryOptions,
): Promise<QueryResult> {
	return waku.store.queryGenerator([decoder], storeQueryOptions)
}

export function decodeMessagePayload(wakuMessage: DecodedMessage): string {
	return bytesToUtf8(wakuMessage.payload)
}
