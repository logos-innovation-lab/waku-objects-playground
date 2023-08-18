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

const peerMultiaddr = multiaddr(
	// '/dns4/ws.waku.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm5wH4dPAV6zDfrBHkWt9Wu9iiXT4ehHdUArDUbEevzmBY',
	'/dns4/ws.waku-1.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm8gXHntr3SB5sde11pavjptaoiqyvwoX3GyEZWKMPiuBu',

	// use this address for local testing
	// '/ip4/127.0.0.1/tcp/8000/ws/p2p/16Uiu2HAm53sojJN72rFbYg6GV2LpRRER9XeWkiEAhjKy3aL9cN5Z',
)

export type ContentTopic = 'private-message' | 'profile' | 'chats' | 'objects' | 'group-chats'

export type QueryResult = AsyncGenerator<Promise<DecodedMessage | undefined>[]>

const topicApp = 'wakuobjects-playground'
const topicVersion = '1'

function getTopic(contentTopic: ContentTopic, id: string | '' = '') {
	return `/${topicApp}/${topicVersion}/${contentTopic}/${id}`
}

interface ConnectWakuOptions {
	onDisconnect?: () => void
}

export async function connectWaku(options?: ConnectWakuOptions) {
	const waku = await createLightNode()

	waku.libp2p.addEventListener('peer:disconnect', () => {
		if (options?.onDisconnect && waku.libp2p.getConnections().length === 0) {
			options.onDisconnect()
		}
	})

	await waku.start()
	await waku.dial(peerMultiaddr)
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

	return await waku.lightPush.send(encoder, { payload })
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

	return await waku.lightPush.send(encoder, { payload })
}
