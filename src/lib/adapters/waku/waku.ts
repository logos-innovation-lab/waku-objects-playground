import { createLightNode } from '@waku/create'
import * as utils from '@waku/utils/bytes'
import {
    waitForRemotePeer,
    createEncoder,
    createDecoder,
    type DecodedMessage,
    PageDirection,
} from '@waku/core'
import { multiaddr } from '@multiformats/multiaddr'
import { type LightNode, Protocols, type Callback, type StoreQueryOptions } from '@waku/interfaces'

const peerMultiaddr = multiaddr(
    '/dns4/ws.waku.apyos.dev/tcp/443/wss/p2p/16Uiu2HAm5wH4dPAV6zDfrBHkWt9Wu9iiXT4ehHdUArDUbEevzmBY'
    // '/ip4/127.0.0.1/tcp/8000/wss/p2p/16Uiu2HAkvxqFicgLvsTUqKiX5ZUozN9c7aA82msxXo9qftZsMdGB'
)

type ContentTopic = 'private-message' | 'profile' | 'contact' | 'chats'
type QueryResult = AsyncGenerator<Promise<DecodedMessage | undefined>[]>

const topicApp = 'wakuobjects-playground'
const topicVersion = '1'

export function getTopic(contentTopic: ContentTopic, id: string) {
    return `/${topicApp}/${topicVersion}/${contentTopic}/${id}`
}


export function privateMessageTopic(id: string) {
    return getTopic('private-message', id)
}

export async function connectWaku() {
    const waku = await createLightNode()
    await waku.start()
    await waku.dial(peerMultiaddr)
    await waitForRemotePeer(waku, [Protocols.Filter, Protocols.LightPush, Protocols.Store])

    return waku
}

export async function subscribe(waku: LightNode, contentTopic: ContentTopic, id: string, callback: Callback<DecodedMessage>) {
    const messageDecoder = createDecoder(getTopic(contentTopic, id))
    const unsubscribe = await waku.filter.subscribe([messageDecoder], callback)

    return unsubscribe
}

export async function readProfile(waku: LightNode, id: string) {
    return await readStore(waku, getTopic('profile', id))
}

export async function storeDocument(waku: LightNode, contentTopicName: ContentTopic, id: string, document: unknown) {
    const contentTopic = getTopic(contentTopicName, id)
    const encoder = createEncoder({ contentTopic })
    const json = JSON.stringify(document)
    const payload = utils.utf8ToBytes(json)

    return await waku.lightPush.send(encoder, { payload })
}

export async function readLatestDocument(waku: LightNode, contentTopic: ContentTopic, id: string): Promise<unknown | undefined> {
    const storeQueryOptions: StoreQueryOptions = {
        pageDirection: PageDirection.BACKWARD,
        pageSize: 1,
    }
    const topic = getTopic(contentTopic, id)

    const decodedMessages = await readStore(waku, topic, storeQueryOptions)
    for await (const messagePromises of decodedMessages) {
        for (const messagePromise of messagePromises) {
            const message = await messagePromise
            if (message) {
                const decodedPayload = decodeMessagePayload(message)
                
                return JSON.parse(decodedPayload)
            } else {
                return
            }
        }
    }
}

export async function parseQueryResults<T>(results: QueryResult): Promise<T[]> {
    const typedResults: T[] = []
    for await (const messagePromises of results) {
        for (const messagePromise of messagePromises) {
            const message = await messagePromise
            if (message) {
                const decodedPayload = decodeMessagePayload(message)
                
                const typedPayload = JSON.parse(decodedPayload) as T
                typedResults.push(typedPayload)
            }
        }
    }
    return typedResults
}

export async function readStore(waku: LightNode, contentTopic: string, storeQueryOptions?: StoreQueryOptions): Promise<QueryResult> {
    const decoder = createDecoder(contentTopic)
    return waku.store.queryGenerator([decoder], storeQueryOptions)
}

export function decodeMessagePayload(wakuMessage: DecodedMessage): string {
    return utils.bytesToUtf8(wakuMessage.payload)
}

export async function sendMessage(
    waku: LightNode,
    id: string,
    message: unknown,
) {
    const json = JSON.stringify(message)
    const payload = utils.utf8ToBytes(json)
    const contentTopic = getTopic('private-message', id)
    const encoder = createEncoder({ contentTopic });

    return await waku.lightPush.send(encoder, { payload })
}
