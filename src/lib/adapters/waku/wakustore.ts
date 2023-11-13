import type { IDecoder, IEncoder, SendError } from '@waku/sdk'
import { decodeMessagePayload, readStore, storeDocument, subscribe } from './waku'
import type { QueryResult } from './waku'
import {
	PageDirection,
	type LightNode,
	type StoreQueryOptions,
	type Unsubscribe,
} from '@waku/interfaces'
import type { DecodedMessage } from '@waku/message-encryption'

interface QueryOptions extends StoreQueryOptions {
	limit?: number
}

interface Query {
	decoder: IDecoder<DecodedMessage>
	queryOptions?: QueryOptions
}

export interface Wakustore {
	readonly waku: LightNode
	docQuery: (decoder: IDecoder<DecodedMessage>, queryOptions?: QueryOptions) => Query
	collectionQuery: (decoder: IDecoder<DecodedMessage>, queryOptions?: QueryOptions) => Query
	onSnapshot: <T>(
		query: Query,
		callback: (value: T, decodedMessage: DecodedMessage) => void,
	) => Promise<Unsubscribe>
	getDoc: <T>(decoder: IDecoder<DecodedMessage>) => Promise<T | undefined>
	setDoc: <T>(encoder: IEncoder, data: T) => Promise<SendError[] | undefined>
	getDecodedMessage: (decoder: IDecoder<DecodedMessage>) => Promise<DecodedMessage | undefined>
	decodeDoc: <T>(decodedMessage: DecodedMessage) => Promise<T | undefined>
}

export function makeWakustore(waku: LightNode): Wakustore {
	function makeQuery(decoder: IDecoder<DecodedMessage>, queryOptions?: QueryOptions): Query {
		return {
			decoder,
			queryOptions,
		}
	}

	function docQuery(decoder: IDecoder<DecodedMessage>, queryOptions?: QueryOptions): Query {
		return makeQuery(decoder, {
			pageDirection: PageDirection.BACKWARD,
			limit: 1,
			...queryOptions,
		})
	}

	function collectionQuery(decoder: IDecoder<DecodedMessage>, queryOptions?: QueryOptions): Query {
		return makeQuery(decoder, queryOptions)
	}

	function decodeDoc<T>(message: DecodedMessage): T {
		const decodedPayload = decodeMessagePayload(message)
		const typedPayload = JSON.parse(decodedPayload) as T & { timestamp?: number }

		// HACK to use waku timestamp instead of the type T's
		if (
			typedPayload &&
			typeof typedPayload === 'object' &&
			!Array.isArray(typedPayload) &&
			typedPayload.timestamp
		) {
			return {
				...typedPayload,
				timestamp: Number(message.timestamp),
				origTimestamp: typedPayload.timestamp,
			}
		} else {
			return typedPayload
		}
	}

	async function getQueryResults(
		results: QueryResult,
		queryOptions?: QueryOptions,
	): Promise<DecodedMessage[]> {
		const decodedMessages: DecodedMessage[] = []
		for await (const messagePromises of results) {
			for (const messagePromise of messagePromises) {
				const message = await messagePromise
				if (message) {
					decodedMessages.push(message)

					// reached the limit
					if (
						Number.isInteger(queryOptions?.limit) &&
						decodedMessages.length === queryOptions?.limit
					) {
						return decodedMessages
					}
				}
			}
		}
		return decodedMessages
	}

	async function getDecodedMessage(
		decoder: IDecoder<DecodedMessage>,
	): Promise<DecodedMessage | undefined> {
		const query = docQuery(decoder)
		const queryOptions = {
			...query.queryOptions,
			pageSize: query.queryOptions?.pageSize ?? query.queryOptions?.limit,
		}

		const result = await readStore(waku, query.decoder, queryOptions)
		const values = await getQueryResults(result, queryOptions)

		if (values.length === 1) {
			return values[0]
		}
	}

	async function getDoc<T>(decoder: IDecoder<DecodedMessage>): Promise<T | undefined> {
		const decodedMessage = await getDecodedMessage(decoder)
		if (!decodedMessage) {
			return
		}

		return decodeDoc<T>(decodedMessage)
	}

	async function setDoc<T>(encoder: IEncoder, data: T) {
		return await storeDocument(waku, encoder, data)
	}

	async function onSnapshot<T>(
		query: Query,
		callback: (value: T, decodedMessage: DecodedMessage) => void,
	): Promise<Unsubscribe> {
		const subscription = await subscribe(waku, query.decoder, (msg: DecodedMessage) => {
			const typedResult = decodeDoc<T>(msg)
			callback(typedResult, msg)
		})

		const queryOptions = {
			...query.queryOptions,
			pageSize: query.queryOptions?.pageSize ?? query.queryOptions?.limit,
		}
		const result = await readStore(waku, query.decoder, queryOptions)
		const messages = await getQueryResults(result, queryOptions)

		for (const message of messages) {
			const value = decodeDoc<T>(message)
			callback(value, message)
		}

		return subscription
	}

	return {
		waku,
		docQuery,
		collectionQuery,
		onSnapshot,
		getDoc,
		setDoc,
		getDecodedMessage,
		decodeDoc,
	}
}
