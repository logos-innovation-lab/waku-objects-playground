import { connectWaku, type ConnectWakuOptions, sendMessage } from '$lib/adapters/waku/waku'
import { isGroupChatId, type Message } from '$lib/stores/chat'
import type { LightNode, TimeFilter, Unsubscribe } from '@waku/interfaces'
import { PageDirection } from '@waku/interfaces'
import { makeWakustore } from './wakustore'

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

export class SafeWaku {
	public lightNode: LightNode | undefined = undefined
	private subscriptions = new Map<string, Subscription>()
	private lastMessages = new Map<string, Message>()
	private lastSentTimestamp = 0
	private isSubscribing = false
	public readonly errors = {
		numDisconnect: 0,
		numSendError: 0,
	}
	private queuedMessages: QueuedMessage[] = []
	private isHandlingMessage = false

	constructor(public readonly options?: ConnectWakuOptions) {}

	async connect() {
		if (this.lightNode) {
			return this.lightNode
		}

		this.lightNode = await this.connectWaku()
		return this.lightNode
	}

	async subscribe(
		chatId: string,
		timeFilter: TimeFilter | undefined,
		callback: (message: Message, chatId: string) => Promise<void>,
	) {
		if (!this.lightNode) {
			this.lightNode = await this.connectWaku()
		}

		const lastMessageTime = this.lastMessages.get(chatId)?.timestamp || 0
		const startTime = new Date(lastMessageTime + 1)
		const endTime = new Date()
		const calculatedTimeFilter = lastMessageTime
			? { startTime, endTime }
			: { startTime: endTime, endTime }
		timeFilter = timeFilter || calculatedTimeFilter

		const talkEmoji = isGroupChatId(chatId) ? '🗫' : '🗩'
		console.debug(`${talkEmoji}  subscribe to ${chatId}`)

		const ws = makeWakustore(this.lightNode)
		const unsubscribe = await ws.onSnapshot<Message>(
			ws.collectionQuery('private-message', chatId, {
				timeFilter,
				pageDirection: PageDirection.BACKWARD,
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

	async sendMessage(id: string, message: Message) {
		if (!this.lightNode) {
			this.lightNode = await connectWaku(this.options)
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
				error = await sendMessage(this.lightNode, id, message)
			} catch (e) {
				error = e
			} finally {
				if (error) {
					this.errors.numSendError++
					console.debug(`⁉️  Error: ${error}`)
					console.debug(`🕓 Waiting ${timeout} milliseconds...`)
					await new Promise((r) => setTimeout(r, timeout))
					if (timeout < 120_000) {
						timeout += timeout
					}
				}
			}
		} while (error)

		const elapsed = Date.now() - start

		console.debug({ message, id })

		if (elapsed > 1000) {
			console.debug(`⏰ sending message took ${elapsed} milliseconds`)
		}
	}

	private connectWaku() {
		console.debug('connectWaku')

		const waku = connectWaku({
			onConnect: (connections) => {
				console.debug('✅ connected to waku', { connections })
				this.safeResubscribe()

				if (this.options?.onConnect) {
					this.options?.onConnect(connections)
				}
			},
			onDisconnect: () => {
				console.debug('❌ disconnected from waku')
				this.errors.numDisconnect++

				if (this.options?.onDisconnect) {
					this.options.onDisconnect()
				}
			},
		})
		return waku
	}

	private async safeResubscribe() {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				return await this.resubscribe()
			} catch (e) {
				console.error(`⁉️  ${e}`)
			}
		}
	}

	private async resubscribe() {
		if (!this.lightNode) {
			return
		}

		if (this.isSubscribing) {
			return
		}

		this.isSubscribing = true

		const chatIds = this.subscriptions.keys()
		for (const subscription of this.subscriptions.values()) {
			await subscription.unsubscribe()
		}

		const oldSubscriptions = this.subscriptions
		this.subscriptions = new Map()

		for (const chatId of chatIds) {
			const callback = oldSubscriptions.get(chatId)?.callback
			if (callback) {
				await this.subscribe(chatId, undefined, callback)
			}
		}

		this.isSubscribing = false
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
				const lastMessage = this.lastMessages.get(chatId)
				if (
					lastMessage &&
					lastMessage.timestamp === chatMessage.timestamp &&
					lastMessage.type === chatMessage.type &&
					lastMessage.fromAddress === chatMessage.fromAddress
				) {
					console.debug('🙈 ignoring duplicate message', { chatMessage })
					continue
				}

				this.lastMessages.set(chatId, chatMessage)

				await callback(queuedMessage.chatMessage, queuedMessage.chatId)
			}
		}

		this.isHandlingMessage = false
	}
}
