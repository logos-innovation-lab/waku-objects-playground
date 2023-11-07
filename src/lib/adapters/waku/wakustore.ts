import type { DecodedMessage, SendError } from '@waku/sdk'
import { decodeMessagePayload, readStore, storeDocument, subscribe } from './waku'
import type { ContentTopic, QueryResult } from './waku'
import {
	PageDirection,
	type LightNode,
	type StoreQueryOptions,
	type Unsubscribe,
} from '@waku/interfaces'

interface QueryOptions extends StoreQueryOptions {
	limit?: number
}

interface Query {
	contentTopic: ContentTopic
	symKey: Uint8Array
	queryOptions?: QueryOptions
}

export interface Wakustore {
	readonly waku: LightNode
	docQuery: (contentTopic: ContentTopic, symKey: Uint8Array, queryOptions?: QueryOptions) => Query
	collectionQuery: (
		contentTopic: ContentTopic,
		symKey: Uint8Array,
		queryOptions?: QueryOptions,
	) => Query
	onSnapshot: <T>(query: Query, callback: (value: T) => void) => Promise<Unsubscribe>
	getDoc: <T>(contentTopic: ContentTopic, symKey: Uint8Array) => Promise<T | undefined>
	setDoc: <T>(
		contentTopic: ContentTopic,
		symKey: Uint8Array,
		data: T,
	) => Promise<SendError[] | undefined>
}

export function makeWakustore(waku: LightNode) {
	function makeQuery(
		contentTopic: ContentTopic,
		symKey: Uint8Array,
		queryOptions?: QueryOptions,
	): Query {
		return {
			contentTopic,
			symKey,
			queryOptions,
		}
	}

	function docQuery(
		contentTopic: ContentTopic,
		symKey: Uint8Array,
		queryOptions?: QueryOptions,
	): Query {
		return makeQuery(contentTopic, symKey, {
			pageDirection: PageDirection.BACKWARD,
			limit: 1,
			...queryOptions,
		})
	}

	function collectionQuery(
		contentTopic: ContentTopic,
		symKey: Uint8Array,
		queryOptions?: QueryOptions,
	): Query {
		return makeQuery(contentTopic, symKey, queryOptions)
	}

	function decodedMessageToTypedResult<T>(message: DecodedMessage): T {
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

	async function parseQueryResults<T>(
		results: QueryResult,
		queryOptions?: QueryOptions,
	): Promise<T[]> {
		const typedResults: T[] = []
		for await (const messagePromises of results) {
			for (const messagePromise of messagePromises) {
				const message = await messagePromise
				if (message) {
					const typedResult = decodedMessageToTypedResult<T>(message)
					typedResults.push(typedResult)

					// reached the limit
					if (
						Number.isInteger(queryOptions?.limit) &&
						typedResults.length === queryOptions?.limit
					) {
						return typedResults
					}
				}
			}
		}
		return typedResults
	}

	async function getDoc<T>(contentTopic: ContentTopic, symKey: Uint8Array): Promise<T | undefined> {
		const query = docQuery(contentTopic, symKey)
		const queryOptions = {
			...query.queryOptions,
			pageSize: query.queryOptions?.pageSize ?? query.queryOptions?.limit,
		}

		const result = await readStore(waku, query.contentTopic, query.symKey, queryOptions)
		const values = await parseQueryResults<T>(result, queryOptions)

		if (values.length === 1) {
			return values[0]
		}
	}

	async function setDoc<T>(contentTopic: ContentTopic, symKey: Uint8Array, data: T) {
		return await storeDocument(waku, contentTopic, symKey, data)
	}

	async function onSnapshot<T>(query: Query, callback: (value: T) => void): Promise<Unsubscribe> {
		const subscription = await subscribe(
			waku,
			query.contentTopic,
			query.symKey,
			(msg: DecodedMessage) => {
				const typedResult = decodedMessageToTypedResult<T>(msg)
				callback(typedResult)
			},
		)

		const queryOptions = {
			...query.queryOptions,
			pageSize: query.queryOptions?.pageSize ?? query.queryOptions?.limit,
		}
		const result = await readStore(waku, query.contentTopic, query.symKey, queryOptions)
		const values = await parseQueryResults<T>(result, queryOptions)

		for (const value of values) {
			callback(value)
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
	}
}
