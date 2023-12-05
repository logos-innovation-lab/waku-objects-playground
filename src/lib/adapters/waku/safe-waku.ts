import { connectWaku, storeDocument, type ConnectWakuOptions } from '$lib/adapters/waku/waku'
import type { ChatMessage, Message, WithoutMeta } from '$lib/stores/chat'
import type { IDecoder, IEncoder, LightNode, TimeFilter, Unsubscribe } from '@waku/interfaces'
import { PageDirection } from '@waku/interfaces'
import { makeWakustore } from './wakustore'
import { createSymmetricEncoder } from './codec'
import type { DecodedMessage } from '@waku/message-encryption'
import { hashDecodedMessage } from './message-hash'
import { compressPublicKey } from './crypto'

type Callback = (message: ChatMessage, decodedMessage: DecodedMessage) => Promise<void>

interface QueuedMessage {
	chatMessage: ChatMessage
	decodedMessage: DecodedMessage
	chatId: string
	callback: Callback
}

interface Subscription {
	unsubscribe: Unsubscribe
	callback: Callback
	decoder: IDecoder<DecodedMessage>
	id: string
}

async function sleep(msec: number) {
	return await new Promise((r) => setTimeout(r, msec))
}

export class SafeWaku {
	public lightNode: LightNode | undefined = undefined
	private subscriptions = new Map<string, Subscription>()
	private lastMessages = new Map<string, ChatMessage>()
	private isReSubscribing = false
	public readonly errors = {
		numDisconnect: 0,
		numSendError: 0,
	}
	private queuedMessages: QueuedMessage[] = []
	private isHandlingMessage = false
	private logging = true
	private logDateTime = true
	private isConnecting = false

	constructor(public readonly options?: ConnectWakuOptions) {}

	async connect() {
		if (this.lightNode) {
			return this.lightNode
		}

		this.lightNode = await this.safeConnectWaku()
		return this.lightNode
	}

	async subscribeEncrypted(
		id: string,
		decoder: IDecoder<DecodedMessage>,
		callback: Callback,
		timeFilter?: TimeFilter,
	) {
		if (!this.lightNode) {
			this.lightNode = await this.safeConnectWaku()
		}

		const lastMessageTime = this.lastMessages.get(id)?.timestamp || 0
		const startTime = new Date(lastMessageTime + 1)
		const endTime = new Date()
		const calculatedTimeFilter = lastMessageTime
			? { startTime, endTime }
			: { startTime: endTime, endTime }
		timeFilter = timeFilter || calculatedTimeFilter

		const talkEmoji = '🗩'
		this.log(`${talkEmoji}  subscribe to ${id}`)

		const ws = makeWakustore(this.lightNode)
		const unsubscribe = await ws.onSnapshot<Message>(
			ws.collectionQuery(decoder, {
				timeFilter,
				pageDirection: PageDirection.FORWARD,
				pageSize: 1000,
			}),
			(message, decodedMessage) => {
				const chatMessage = this.augmentMessageWithMetadata(message, decodedMessage)
				this.queueMessage(id, callback, chatMessage, decodedMessage)
			},
		)

		const subscription = {
			unsubscribe,
			callback,
			id,
			decoder,
		}

		this.subscriptions.set(id, subscription)
	}

	async unsubscribeAll() {
		for (const subscription of this.subscriptions.values()) {
			await subscription.unsubscribe()
		}

		this.subscriptions = new Map()
	}

	async sendMessage(
		message: WithoutMeta<Message>,
		encryptionKey: Uint8Array,
		sigPrivKey: Uint8Array,
	) {
		const encoder = createSymmetricEncoder({
			contentTopic: 'private-message',
			symKey: encryptionKey,
			sigPrivKey,
		})
		return await this.storeEncrypted(encoder, message)
	}

	async storeEncrypted(encoder: IEncoder, message: unknown) {
		if (!this.lightNode) {
			this.lightNode = await this.safeConnectWaku()
		}

		let error = undefined
		let timeout = 1_000

		const start = Date.now()

		do {
			try {
				error = await storeDocument(this.lightNode, encoder, message)
			} catch (e) {
				error = e
			} finally {
				if (error) {
					this.errors.numSendError++
					this.log(`⁉️  Error: ${error}`, { error })
					this.log(`🕓 Waiting ${timeout} milliseconds...`)
					await sleep(timeout)
					if (timeout < 120_000) {
						timeout += timeout
					}
				}
			}
		} while (error)

		const elapsed = Date.now() - start

		if (elapsed > 1000) {
			this.log(`⏰ sending message took ${elapsed} milliseconds`)
		}
	}

	private augmentMessageWithMetadata(
		message: Message,
		decodedMessage: DecodedMessage,
	): ChatMessage {
		return {
			...message,
			id: hashDecodedMessage(decodedMessage),
			timestamp: Number(decodedMessage.timestamp),
			senderPublicKey: decodedMessage.signaturePublicKey
				? '0x' + compressPublicKey(decodedMessage.signaturePublicKey)
				: '',
		}
	}

	private async safeConnectWaku() {
		if (this.isConnecting) {
			while (!this.lightNode) {
				await sleep(100)
			}
			return this.lightNode
		}

		this.isConnecting = true

		let waku: LightNode | undefined
		while (!waku) {
			try {
				waku = await this.connectWaku()
			} catch (e) {
				this.log(`⁉️  Error while connecting: ${e}`)
			}
		}

		this.isConnecting = false

		return waku
	}

	private async connectWaku() {
		const waku = await connectWaku({
			onConnect: (connections) => {
				this.log('✅ connected to waku', { connections })
				this.safeResubscribe()

				if (this.options?.onConnect) {
					this.options?.onConnect(connections)
				}
			},
			onDisconnect: () => {
				this.log('❌ disconnected from waku')
				this.errors.numDisconnect++

				if (this.options?.onDisconnect) {
					this.options.onDisconnect()
				}
			},
		})
		return waku
	}

	private async safeResubscribe() {
		if (this.isReSubscribing) {
			return
		}

		this.isReSubscribing = true

		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				await this.resubscribe()
				break
			} catch (e) {
				this.log(`⁉️ Error while resubscribing: ${e}`)

				// sleep to avoid infinite looping
				await sleep(1_000)
			}
		}

		this.isReSubscribing = false
	}

	private async resubscribe() {
		if (!this.lightNode) {
			return
		}

		const chatIds = this.subscriptions.keys()
		for (const subscription of this.subscriptions.values()) {
			await subscription.unsubscribe()
		}

		const oldSubscriptions = this.subscriptions
		this.subscriptions = new Map()

		let subscribeError = undefined
		for (const chatId of chatIds) {
			const subscription = oldSubscriptions.get(chatId)
			if (!subscription) {
				continue
			}
			if (!subscribeError) {
				try {
					await this.subscribeEncrypted(
						subscription.id,
						subscription.decoder,
						subscription.callback,
					)
				} catch (e) {
					subscribeError = e
					this.subscribeEmpty(chatId, subscription.callback, subscription.decoder)
				}
			} else {
				this.subscribeEmpty(chatId, subscription.callback, subscription.decoder)
			}
		}

		if (subscribeError) {
			throw subscribeError
		}
	}

	private subscribeEmpty(chatId: string, callback: Callback, decoder: IDecoder<DecodedMessage>) {
		const unsubscribe = () => {
			/* empty */
		}
		const subscription = {
			id: chatId,
			callback,
			unsubscribe,
			decoder,
		}
		this.subscriptions.set(chatId, subscription)
	}

	private areMessagesEqual(a: ChatMessage, b: ChatMessage): boolean {
		if (a.timestamp !== b.timestamp) {
			return false
		}
		if (a.senderPublicKey !== b.senderPublicKey) {
			return false
		}
		if (a.id !== b.id) {
			return false
		}

		return true
	}

	private async queueMessage(
		chatId: string,
		callback: Callback,
		chatMessage: ChatMessage,
		decodedMessage: DecodedMessage,
	) {
		this.queuedMessages.push({
			callback,
			chatMessage,
			decodedMessage,
			chatId,
		})

		if (this.isHandlingMessage) {
			return
		}

		this.handleMessages().catch((e) => this.log(`⁉️ Error in handleMessage: ${e}`))
	}

	private async handleMessages() {
		this.isHandlingMessage = true

		while (this.queuedMessages.length > 0) {
			const queuedMessage = this.queuedMessages.shift()
			if (queuedMessage) {
				// deduplicate already seen messages
				const message = queuedMessage.chatMessage
				const lastMessage = this.lastMessages.get(queuedMessage.chatId)
				if (lastMessage && this.areMessagesEqual(lastMessage, message)) {
					this.log('🙈 ignoring duplicate message', { message, lastMessage })
					continue
				}

				this.lastMessages.set(queuedMessage.chatId, message)

				try {
					await queuedMessage.callback(queuedMessage.chatMessage, queuedMessage.decodedMessage)
				} catch (e) {
					this.log(`⁉️ Error in callback: ${e}`)
				}
			}
		}

		this.isHandlingMessage = false
	}

	private log(...args: unknown[]) {
		if (!this.logging) {
			return
		}
		if (!this.logDateTime) {
			console.debug(...args)
			return
		}
		const isoTime = new Date().toISOString().replace('T', ' ').replace('Z', '')
		console.debug(isoTime, ...args)
	}
}
