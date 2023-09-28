import {
	createLightNode,
	waitForRemotePeer,
	createEncoder,
	createDecoder,
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

const peers = [
	// use this address for local testing
	'/ip4/127.0.0.1/tcp/8000/ws/p2p/16Uiu2HAm53sojJN72rFbYg6GV2LpRRER9XeWkiEAhjKy3aL9cN5Z',

	// '/dns4/ws.waku.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm5wH4dPAV6zDfrBHkWt9Wu9iiXT4ehHdUArDUbEevzmBY',
	// '/dns4/ws.waku-1.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm8gXHntr3SB5sde11pavjptaoiqyvwoX3GyEZWKMPiuBu',

	// '/dns4/waku.gra.nomad.apyos.dev/tcp/443/wss/p2p/16Uiu2HAmDvywnsGaB32tFqwjTsg8sfC1ZV2EXo3xjxM4V2gvH6Up',
	// '/dns4/waku.bhs.nomad.apyos.dev/tcp/443/wss/p2p/16Uiu2HAkvrRkEHRMfe26F8NCWUfzMuaCfyCzwoPSUYG7yminM5Bn',
	// '/dns4/waku.de.nomad.apyos.dev/tcp/443/wss/p2p/16Uiu2HAmRgjA134DcoyK8r44pKWJQ69C7McLSWtRgxUVwkKAsbGx',
]

export type ContentTopic = 'private-message' | 'profile' | 'chats' | 'objects' | 'group-chats'

export type QueryResult = AsyncGenerator<Promise<DecodedMessage | undefined>[]>

const topicApp = 'wakuobjects-playground'
const topicVersion = '1'

function getTopic(contentTopic: ContentTopic, id: string | '' = '') {
	return `/${topicApp}/${topicVersion}/${contentTopic}/${id}`
}

export interface ConnectWakuOptions {
	onDisconnect?: () => void
	onConnect?: (connections: unknown[]) => void
}

export async function connectWaku(options?: ConnectWakuOptions) {
	const waku = await createLightNode()

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
	id: string,
	callback: Callback<DecodedMessage>,
): Promise<Unsubscribe> {
	const messageDecoder = createDecoder(getTopic(contentTopic, id))
	const unsubscribe = await waku.filter.subscribe([messageDecoder], callback)

	return unsubscribe
}

export async function storeDocument(
	waku: LightNode,
	contentTopicName: ContentTopic,
	id: string | '',
	document: unknown,
) {
	const contentTopic = getTopic(contentTopicName, id)
	const encoder = createEncoder({ contentTopic })
	const json = JSON.stringify(document)
	const payload = utf8ToBytes(json)

	const sendResult = await waku.lightPush.send(encoder, { payload })
	return sendResult.error
}

export async function readStore(
	waku: LightNode,
	contentTopic: ContentTopic,
	id: string | '' = '',
	storeQueryOptions?: StoreQueryOptions,
): Promise<QueryResult> {
	const topic = getTopic(contentTopic, id)
	const decoder = createDecoder(topic)

	return waku.store.queryGenerator([decoder], storeQueryOptions)
}

export function decodeMessagePayload(wakuMessage: DecodedMessage): string {
	return bytesToUtf8(wakuMessage.payload)
}

export async function sendMessage(waku: LightNode, id: string, message: unknown) {
	const json = JSON.stringify(message)
	const payload = utf8ToBytes(json)
	const contentTopic = getTopic('private-message', id)
	const encoder = createEncoder({ contentTopic })

	const sendResult = await waku.lightPush.send(encoder, { payload })
	return sendResult.error
}
