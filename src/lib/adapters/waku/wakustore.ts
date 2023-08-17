import type { DecodedMessage } from '@waku/sdk'
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
	id: string
	queryOptions?: QueryOptions
}

export const latestQueryOption = {
	pageDirection: PageDirection.BACKWARD,
	pageSize: 1,
}

export function makeWakustore(waku: LightNode) {
	function makeQuery(contentTopic: ContentTopic, id: string, queryOptions?: QueryOptions): Query {
		return {
			contentTopic,
			id,
			queryOptions,
		}
	}

	function docQuery(contentTopic: ContentTopic, id: string, queryOptions?: QueryOptions): Query {
		return makeQuery(contentTopic, id, {
			pageDirection: PageDirection.BACKWARD,
			limit: 1,
			...queryOptions,
		})
	}

	function collectionQuery(
		contentTopic: ContentTopic,
		id: string,
		queryOptions?: QueryOptions,
	): Query {
		return makeQuery(contentTopic, id, queryOptions)
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
					const decodedPayload = decodeMessagePayload(message)
					const timestamp = Number(message.timestamp)
					console.debug({ decodedPayload, timestamp })

					const typedPayload = JSON.parse(decodedPayload) as T
					typedResults.push(typedPayload)

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

	async function getDoc<T>(contentTopic: ContentTopic, id: string): Promise<T> {
		const query = docQuery(contentTopic, id)
		const queryOptions = {
			...query.queryOptions,
			pageSize: query.queryOptions?.pageSize ?? query.queryOptions?.limit,
		}

		const result = await readStore(waku, query.contentTopic, query.id, queryOptions)
		const values = await parseQueryResults<T>(result, queryOptions)

		if (values.length === 1) {
			return values[0]
		}
		throw 'not found'
	}

	async function setDoc<T>(contentTopic: ContentTopic, id: string, data: T) {
		await storeDocument(waku, contentTopic, id, data)
	}

	async function onSnapshot<T>(query: Query, callback: (value: T) => void): Promise<Unsubscribe> {
		const queryOptions = {
			...query.queryOptions,
			pageSize: query.queryOptions?.pageSize ?? query.queryOptions?.limit,
		}
		const result = await readStore(waku, query.contentTopic, query.id, queryOptions)
		const values = await parseQueryResults<T>(result, queryOptions)

		for (const value of values) {
			callback(value)
		}

		return await subscribe(waku, query.contentTopic, query.id, (msg: DecodedMessage) => {
			const decodedPayload = decodeMessagePayload(msg)
			const decodedValue = JSON.parse(decodedPayload) as T

			callback(decodedValue)
		})
	}

	return {
		makeQuery,
		docQuery,
		collectionQuery,
		onSnapshot,
		getDoc,
		setDoc,
	}
}
