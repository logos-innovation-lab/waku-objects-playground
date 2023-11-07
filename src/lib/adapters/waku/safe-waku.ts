import { connectWaku, type ConnectWakuOptions, sendMessage } from '$lib/adapters/waku/waku'
import type { Message } from '$lib/stores/chat'
import type { LightNode, TimeFilter, Unsubscribe } from '@waku/interfaces'
import { PageDirection } from '@waku/interfaces'
import { makeWakustore } from './wakustore'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

type Callback = (message: Message, chatId: string) => Promise<void>

interface QueuedMessage {
	chatMessage: Message
	chatId: string
	callback: Callback
}

interface Subscription {
	unsubscribe: Unsubscribe
	callback: Callback
}

async function sleep(msec: number) {
	return await new Promise((r) => setTimeout(r, msec))
}

export class SafeWaku {
	public lightNode: LightNode | undefined = undefined
	private subscriptions = new Map<string, Subscription>()
	private lastMessages = new Map<string, Message>()
	private lastSentTimestamp = 0
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

	async subscribe(
		encryptionKey: Uint8Array,
		timeFilter: TimeFilter | undefined,
		callback: (message: Message, chatId: string) => Promise<void>,
	) {
		if (!this.lightNode) {
			this.lightNode = await this.safeConnectWaku()
		}

		const chatId = bytesToHex(encryptionKey)
		const lastMessageTime = this.lastMessages.get(chatId)?.timestamp || 0
		const startTime = new Date(lastMessageTime + 1)
		const endTime = new Date()
		const calculatedTimeFilter = lastMessageTime
			? { startTime, endTime }
			: { startTime: endTime, endTime }
		timeFilter = timeFilter || calculatedTimeFilter

		const talkEmoji = '🗩'
		this.log(`${talkEmoji}  subscribe to ${chatId}`)

		const ws = makeWakustore(this.lightNode)
		const unsubscribe = await ws.onSnapshot<Message>(
			ws.collectionQuery('private-message', encryptionKey, {
				timeFilter,
				pageDirection: PageDirection.FORWARD,
				pageSize: 1000,
			}),
			(message) => this.queueMessage(callback, message, chatId),
		)

		const subscription = {
			unsubscribe,
			callback,
		}

		this.subscriptions.set(chatId, subscription)
	}

	async unsubscribeAll() {
		for (const subscription of this.subscriptions.values()) {
			await subscription.unsubscribe()
		}

		this.subscriptions = new Map()
	}

	async sendMessage(message: Message, encryptionKey: Uint8Array) {
		if (!this.lightNode) {
			this.lightNode = await this.safeConnectWaku()
		}

		let error = undefined
		let timeout = 1_000

		const start = Date.now()

		if (message.timestamp === this.lastSentTimestamp) {
			message.timestamp++
		}
		this.lastSentTimestamp = message.timestamp

		do {
			try {
				error = await sendMessage(this.lightNode, encryptionKey, message)
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
					const encryptionKey = hexToBytes(chatId)
					await this.subscribe(encryptionKey, undefined, subscription.callback)
				} catch (e) {
					subscribeError = e
					this.subscribeEmpty(chatId, subscription.callback)
				}
			} else {
				this.subscribeEmpty(chatId, subscription.callback)
			}
		}

		if (subscribeError) {
			throw subscribeError
		}
	}

	private subscribeEmpty(chatId: string, callback: Callback) {
		const unsubscribe = () => {
			/* empty */
		}
		const subscription = {
			callback,
			unsubscribe,
		}
		this.subscriptions.set(chatId, subscription)
	}

	private async queueMessage(callback: Callback, chatMessage: Message, chatId: string) {
		this.queuedMessages.push({
			callback,
			chatMessage,
			chatId,
		})

		if (this.isHandlingMessage) {
			return
		}

		this.isHandlingMessage = true

		while (this.queuedMessages.length > 0) {
			const queuedMessage = this.queuedMessages.shift()
			if (queuedMessage) {
				// deduplicate already seen messages
				const message = queuedMessage.chatMessage
				const lastMessage = this.lastMessages.get(chatId)
				if (
					lastMessage &&
					lastMessage.timestamp === message.timestamp &&
					lastMessage.type === message.type &&
					lastMessage.senderPublicKey === message.senderPublicKey
				) {
					this.log('🙈 ignoring duplicate message', { message, lastMessage })
					continue
				}

				this.lastMessages.set(chatId, message)

				try {
					await callback(queuedMessage.chatMessage, queuedMessage.chatId)
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
