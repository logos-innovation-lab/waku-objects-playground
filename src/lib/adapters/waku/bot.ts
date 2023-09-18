// run with pnpm bot <address>

// [ ] admin + commands
// [ ] onlu print nonzero errors

import child_process from 'child_process'
import { PageDirection, type LightNode, type Unsubscribe } from '@waku/interfaces'
import axios from 'axios'

import { connectWaku, sendMessage, storeDocument } from '$lib/adapters/waku/waku'
import { makeWakustore } from '$lib/adapters/waku/wakustore'

const BOT_ENDPOINT = process.env.BOT_ENDPOINT || 'http://172.16.246.1:5000/api/v1/chat'
const BOT_NAME = process.env.BOT_NAME || 'Wendy'
const BOT_CHARACTER = process.env.BOT_CHARACTER || 'Wendy'
const BOT_AVATAR = process.env.BOT_AVATAR || 'QmWtTDsyZBGZPhEEe3fnA24Q3NirqEYqFMifMnHMZkoQ97'
const BOT_ADDRESS = process.env.BOT_ADDRESS || process.argv[2]
const BOT_PRESET = process.env.BOT_PRESET || undefined
const BOT_HISTORY_LIMIT = process.env.BOT_HISTORY_LIMIT
	? parseInt(process.env.BOT_HISTORY_LIMIT, 10)
	: 1024
const BOT_SPEAK_COMMAND = process.env.BOT_SPEAK || undefined

const botProfile = {
	name: BOT_NAME,
	avatar: BOT_AVATAR, // IPFS hash of image comes here
}

export interface UserMessage {
	type: 'user'
	timestamp: number
	fromAddress: string
	text: string
}

export interface InviteMessage {
	type: 'invite'
	timestamp: number
	fromAddress: string
	chatId: string
}

export type Message = UserMessage | InviteMessage

interface QueuedMessage {
	chatMessage: Message
	chatId: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions = new Map<string, any>()
let groupChats = new Set<string>()
const lastMessages = new Map<string, Message>()
let subscriptions = new Map<string, Unsubscribe>()
let isSubscribing = false
const errors = {
	numDisconnect: 0,
	numRequestError: 0,
	numSendError: 0,
	numUndefinedResponse: 0,
}
const queuedMessages: QueuedMessage[] = []
let isHandlingMessage = false

// run main
main().catch(console.error)

async function main() {
	try {
		if (!BOT_ADDRESS) {
			console.error(
				'please provide a bot address as argument or in the BOT_ADDRESS environment variable',
			)
			process.exit(1)
		}

		process.on('uncaughtException', (error) => log(`⁉️  Uncaught exception`, { error }))
		process.on('unhandledRejection', (reason, promise) =>
			log(`⁉️  Unhandled rejection`, { reason, promise }),
		)

		let waku: LightNode | undefined = undefined
		waku = await connectWaku({
			onDisconnect: () => {
				log('❌ disconnected from waku')
				errors.numDisconnect++
			},
			onConnect: () => {
				log('✅ connected to waku')
				safeResubscribe(waku)
			},
		})

		log(`🪪 storing profile as ${BOT_NAME} and avatar as ${BOT_AVATAR}`)
		await storeDocument(waku, 'profile', BOT_ADDRESS, botProfile)

		await subscribe(waku, BOT_ADDRESS, queueMessage)

		await loadGroupChats(waku)
		for (const groupChatId of groupChats) {
			await subscribe(waku, groupChatId, queueMessage)
		}

		setInterval(logStats, 60_000)
	} catch (error) {
		log(`‼️  Top Level Error: `, { error })
	}
}

async function safeResubscribe(waku: LightNode | undefined) {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			return await resubscribe(waku)
		} catch (e) {
			log(`⁉️  ${e}`)
		}
	}
}

async function resubscribe(waku: LightNode | undefined) {
	if (!waku) {
		return
	}

	if (isSubscribing) {
		return
	}

	isSubscribing = true

	const chatIds = subscriptions.keys()
	for (const unsubscribe of subscriptions.values()) {
		await unsubscribe()
	}

	subscriptions = new Map()

	for (const chatId of chatIds) {
		await subscribe(waku, chatId, queueMessage)
	}

	isSubscribing = false
}

async function subscribe(
	waku: LightNode,
	chatId: string,
	callback: (waku: LightNode, message: Message, chatId: string) => Promise<void>,
) {
	const lastMessageTime = lastMessages.get(chatId)?.timestamp || 0
	const startTime = new Date(lastMessageTime + 1)
	const endTime = new Date()
	const timeFilter = lastMessageTime ? { startTime, endTime } : { startTime: endTime, endTime }

	const talkEmoji = isGroupChatId(chatId) ? '🗫' : '🗩'
	log(`${talkEmoji}  subscribe to ${chatId}`)

	const ws = makeWakustore(waku)
	const subscription = await ws.onSnapshot<Message>(
		ws.collectionQuery('private-message', chatId, {
			timeFilter,
			pageDirection: PageDirection.BACKWARD,
			pageSize: 1000,
		}),
		// TODO serialize the incoming messages
		(message) => callback(waku, message, chatId),
	)

	subscriptions.set(chatId, subscription)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
	const isoTime = new Date().toISOString().replace('T', ' ').replace('Z', '')
	console.debug(isoTime, ...args)
}

function logMessage(chatMessage: Message, chatId: string) {
	const emoji = chatMessage.fromAddress === BOT_ADDRESS ? '🤖' : '🧑'
	const talkEmoji = isGroupChatId(chatId) ? '🗫' : '🗩'
	log(`${emoji} ${talkEmoji}  ${chatId.slice(0, 6)}`, { chatMessage })
}

async function queueMessage(waku: LightNode, chatMessage: Message, chatId: string) {
	queuedMessages.push({
		chatMessage,
		chatId,
	})

	if (isHandlingMessage) {
		return
	}

	isHandlingMessage = true

	while (queuedMessages.length > 0) {
		const queuedMessage = queuedMessages.shift()
		if (queuedMessage) {
			await handlePrivateMessage(waku, queuedMessage.chatMessage, queuedMessage.chatId)
		}
	}

	isHandlingMessage = false
}

async function handlePrivateMessage(waku: LightNode, chatMessage: Message, chatId: string) {
	if (chatMessage.fromAddress !== BOT_ADDRESS) {
		logMessage(chatMessage, chatId)
	}

	const lastMessage = lastMessages.get(chatId)
	if (
		lastMessage &&
		lastMessage.timestamp === chatMessage.timestamp &&
		lastMessage.type === chatMessage.type &&
		lastMessage.fromAddress === chatMessage.fromAddress
	) {
		log('🙈 ignoring duplicate message', { chatMessage })
		return
	}

	lastMessages.set(chatId, chatMessage)

	switch (chatMessage.type) {
		case 'invite':
			return handleInviteMessage(waku, chatMessage)
		case 'user':
			return handleUserMessage(waku, chatMessage, chatId)
		default:
			log('🙈 ignoring unknown message type', { chatMessage })
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requestLLM(text: string, name: string, history?: any) {
	log(`🧠 requesting LLM AI...`)
	const request = {
		user_input: text,
		max_new_tokens: 200,
		character: BOT_CHARACTER,
		mode: 'chat',
		auto_max_new_tokens: true,
		history,
		regenerate: false,
		_continue: false,
		your_name: name,
		preset: BOT_PRESET,
	}

	const response = await safeRequest(request)
	history = response?.data?.results?.[0]?.history
	const responseText = history?.visible?.slice(-1)?.[0]?.[1]

	console.debug({ lastSlice: history?.visible?.slice(-1) })

	return {
		response,
		history,
		responseText,
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeRequest(request: any) {
	let error = undefined
	let timeout = 1_000
	do {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const response = (await axios.post(BOT_ENDPOINT, request)) as unknown as any
			// await sleep(Math.floor(Math.random() * 50_000 + 10_000))
			// const response = 'hello'
			return response
		} catch (e) {
			error = e
		} finally {
			if (error) {
				errors.numRequestError++
				log(`⁉️  ${error}`)
				log(`🕓 Waiting ${timeout} milliseconds...`)
				await sleep(timeout)
				if (timeout < 120_000) {
					timeout += timeout
				}
			}
		}
	} while (error)
}

async function handleUserMessage(waku: LightNode, chatMessage: UserMessage, chatId: string) {
	if (isGroupChatId(chatId)) {
		// ignore messages from self
		if (chatMessage.fromAddress === BOT_ADDRESS) {
			log('🙈 ignoring message from self')
			return
		}
		// ignore messages not addressed to bot
		if (!chatMessage.text.startsWith(`@${BOT_ADDRESS}`)) {
			log('🙈 ignoring message not addressed to me')
			return
		}
		return handleSessionUserMessage(waku, chatMessage, chatId)
	}
	return handleSessionUserMessage(waku, chatMessage, chatMessage.fromAddress)
}

async function handleSessionUserMessage(waku: LightNode, chatMessage: UserMessage, chatId: string) {
	const sessionHistory = sessions.get(chatId)

	const name = `@${chatMessage.fromAddress}`
	const { response, history, responseText } = await requestLLM(
		chatMessage.text,
		name,
		sessionHistory,
	)

	if (!responseText) {
		log(`⚠️  undefined response text`, { response })
		errors.numUndefinedResponse++
		return
	}

	if (history?.visible?.length > BOT_HISTORY_LIMIT) {
		history.visible.shift()
		history.internal.shift()
	}

	sessions.set(chatId, history)

	if (!responseText) {
		log(`⛔ empty response`, { chatMessage })
	}

	const text = isGroupChatId(chatId) ? `@${chatMessage.fromAddress} ${responseText}` : responseText

	await safeSendMessage(waku, chatId, {
		type: 'user',
		timestamp: Date.now(),
		text,
		fromAddress: BOT_ADDRESS,
	})

	speak(responseText)
}

async function safeSendMessage(waku: LightNode, id: string, message: Message) {
	let error = undefined
	let timeout = 1_000

	const start = Date.now()

	do {
		try {
			error = await sendMessage(waku, id, message)
		} catch (e) {
			error = e
		} finally {
			if (error) {
				errors.numSendError++
				log(`⁉️  Error: ${error}`)
				log(`🕓 Waiting ${timeout} milliseconds...`)
				await new Promise((r) => setTimeout(r, timeout))
				if (timeout < 120_000) {
					timeout += timeout
				}
			}
		}
	} while (error)

	const elapsed = Date.now() - start

	logMessage(message, id)

	if (elapsed > 1000) {
		log(`⏰ sending message took ${elapsed} milliseconds`)
	}
}

// FIXME temporary hack
function isGroupChatId(id: string) {
	return id.length === 64
}

async function handleInviteMessage(waku: LightNode, message: InviteMessage) {
	if (groupChats.has(message.chatId)) {
		return
	}

	groupChats.add(message.chatId)
	storeGroupChats(waku)

	await subscribe(waku, message.chatId, queueMessage)
}

async function storeGroupChats(waku: LightNode) {
	const ws = makeWakustore(waku)
	await ws.setDoc('chats', BOT_ADDRESS, Array.from(groupChats))
}

async function loadGroupChats(waku: LightNode) {
	const ws = makeWakustore(waku)
	const groupChatsArray = await ws.getDoc<string[]>('chats', BOT_ADDRESS)
	groupChats = new Set(groupChatsArray)
}

function speak(text: string) {
	if (!BOT_SPEAK_COMMAND) {
		return
	}

	try {
		const input = decodeHTML(text)
		child_process.spawn(BOT_SPEAK_COMMAND, [input], { detached: true }).on('error', () => {
			/* ignore */
		})
	} catch (e) {
		/* ignore */
	}
}

function decodeHTML(text: string) {
	const map: { [key: string]: string } = { gt: '>' /* , … */ }
	return text.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);?/gi, function ($0, $1) {
		if ($1[0] === '#') {
			return String.fromCharCode(
				$1[1].toLowerCase() === 'x' ? parseInt($1.substr(2), 16) : parseInt($1.substr(1), 10),
			)
		} else {
			// eslint-disable-next-line no-prototype-builtins
			return map.hasOwnProperty($1) ? map[$1] : $0
		}
	})
}

function sleep(msec: number) {
	return new Promise((r) => setTimeout(r, msec))
}

function logStats() {
	const nonZeroErrors = Object.entries(errors).filter(([, value]) => value !== 0)
	log(`📊 `, { errors: Object.fromEntries(nonZeroErrors) })
}
