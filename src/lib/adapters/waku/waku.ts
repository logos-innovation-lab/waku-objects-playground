import { createLightNode } from "@waku/create"
import * as utils from "@waku/utils/bytes"
import {
    waitForRemotePeer,
    createEncoder,
    createDecoder,
    type Decoder,
    type DecodedMessage,
} from "@waku/core"
import { multiaddr } from '@multiformats/multiaddr'
import { type LightNode, Protocols, type Callback, type StoreQueryOptions } from "@waku/interfaces"

const peerMultiaddr = multiaddr(
    '/dns4/ws.waku.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm5wH4dPAV6zDfrBHkWt9Wu9iiXT4ehHdUArDUbEevzmBY'
)

const topicBase = '/wakuobjects/1/chat-message/proto/'

export async function connectWaku() {
    const waku = await createLightNode()
    await waku.start()
    await waku.dial(peerMultiaddr)
    await waitForRemotePeer(waku, [Protocols.Filter, Protocols.LightPush, Protocols.Store])

    return waku
}  

export async function subscribe(waku: LightNode, id: string, callback: Callback<DecodedMessage>) {
    const contentTopic = topicBase + id
    const messageDecoder = createDecoder(contentTopic)
    await readStore(waku, messageDecoder)
    const unsubscribe = await waku.filter.subscribe([messageDecoder], callback);
    return unsubscribe
}

export async function readProfile(waku: LightNode, id: string) {
    const profileDecoder = createDecoder(topicBase + 'profile' + id)
    return await readStore(waku, profileDecoder)
}

async function readStore(waku: LightNode, decoder: Decoder, storeQueryOptions?: StoreQueryOptions) {
    return waku.store.queryGenerator([decoder], storeQueryOptions)
}

export function decodeMessagePayload(wakuMessage: DecodedMessage): string {
    return utils.bytesToUtf8(wakuMessage.payload)
}

export async function sendMessage(
	waku: LightNode,
    id: string,
	message: string,
) {
	// Post the metadata on Waku
	const payload = utils.utf8ToBytes(message)

    const contentTopic = topicBase + id
    const encoder = createEncoder({ contentTopic });

	// Send the message
	await waku.lightPush.send(encoder, { payload })

	// Return message
	return message
}
