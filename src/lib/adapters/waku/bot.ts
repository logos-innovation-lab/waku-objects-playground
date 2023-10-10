// run with pnpm bot <address>

// [ ] admin + commands
// [ ] onlu print nonzero errors

import child_process from 'child_process'
import type { LightNode } from '@waku/interfaces'
import axios from 'axios'

import { storeDocument } from '$lib/adapters/waku/waku'
import { makeWakustore } from '$lib/adapters/waku/wakustore'
import { SafeWaku } from './safe-waku'
import type { InviteMessage, Message, UserMessage } from '$lib/stores/chat'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions = new Map<string, any>()
let groupChats = new Set<string>()
const lastMessages = new Map<string, Message>()
const errors = {
	numDisconnect: 0,
	numRequestError: 0,
	numSendError: 0,
	numUndefinedResponse: 0,
}
const waku = new SafeWaku()

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

		const lightNode = await waku.connect()
		log(`🪪 storing profile as ${BOT_NAME} and avatar as ${BOT_AVATAR}`)
		await storeDocument(lightNode, 'profile', BOT_ADDRESS, botProfile)

		await waku.subscribe(BOT_ADDRESS, undefined, handlePrivateMessage)

		await loadGroupChats(lightNode)
		for (const groupChatId of groupChats) {
			await waku.subscribe(groupChatId, undefined, handlePrivateMessage)
		}

		setInterval(logStats, 60_000)
	} catch (error) {
		log(`‼️  Top Level Error: `, { error })
	}
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

async function handlePrivateMessage(chatMessage: Message, chatId: string) {
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
			return handleInviteMessage(chatMessage)
		case 'user':
			return handleUserMessage(chatMessage, chatId)
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

async function handleUserMessage(chatMessage: UserMessage, chatId: string) {
	if (isGroupChatId(chatId)) {
		// ignore messages from self
		if (chatMessage.fromAddress === BOT_ADDRESS) {
			log('🙈 ignoring message from self')
			return
		}
		// ignore messages not addressed to bot
		if (!chatMessage.text.includes(`@${BOT_ADDRESS}`)) {
			log('🙈 ignoring message not addressed to me')
			return
		}
		return handleSessionUserMessage(chatMessage, chatId)
	}
	return handleSessionUserMessage(chatMessage, chatMessage.fromAddress)
}

async function handleSessionUserMessage(chatMessage: UserMessage, chatId: string) {
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

	await waku.sendMessage(chatId, {
		type: 'user',
		timestamp: Date.now(),
		text,
		fromAddress: BOT_ADDRESS,
	})

	speak(responseText)
}

// FIXME temporary hack
function isGroupChatId(id: string) {
	return id.length === 64
}

async function handleInviteMessage(message: InviteMessage) {
	if (groupChats.has(message.chatId)) {
		return
	}

	groupChats.add(message.chatId)
	if (waku.lightNode) {
		storeGroupChats(waku.lightNode)
	}

	await waku.subscribe(message.chatId, undefined, handlePrivateMessage)
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
