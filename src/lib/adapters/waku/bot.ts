// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import type { DecodedMessage } from '@waku/sdk'
import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'
import axios from 'axios'

import child_process from 'child_process'
import type { LightNode } from '@waku/interfaces'
import { makeWakustore } from './wakustore'

const BOT_ENDPOINT = process.env.BOT_ENDPOINT || 'http://172.16.246.1:5000/api/v1/chat'
const BOT_NAME = process.env.BOT_NAME || 'Wendy'
const BOT_CHARACTER = process.env.BOT_CHARACTER || 'Wendy'
const BOT_AVATAR = process.env.BOT_AVATAR || 'QmWtTDsyZBGZPhEEe3fnA24Q3NirqEYqFMifMnHMZkoQ97'
const BOT_ADDRESS = process.env.BOT_ADDRESS || process.argv[2]
const BOT_PRESET = process.env.BOT_PRESET || undefined
const BOT_HISTORY_LIMIT = process.env.BOT_HISTORY_LIMIT
	? parseInt(process.env.BOT_HISTORY_LIMIT, 10)
	: 1024

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions = new Map<string, any>()

let groupChats = new Set<string>()

async function main() {
	if (!BOT_ADDRESS) {
		console.error(
			'please provide a bot address as argument or in the BOT_ADDRESS environment variable',
		)
		process.exit(1)
	}

	const waku = await connectWaku()

	console.debug('✅ connected to waku')

	await storeDocument(waku, 'profile', BOT_ADDRESS, botProfile)

	console.debug(`✨ subscribe to ${BOT_ADDRESS}`)
	await subscribe(waku, 'private-message', BOT_ADDRESS, (msg) =>
		handlePrivateMessage(waku, msg, BOT_ADDRESS),
	)

	await loadGroupChats(waku)
	for (const groupChatId of groupChats) {
		console.debug(`✨ subscribe to ${groupChatId}`)
		await subscribe(waku, 'private-message', groupChatId, (msg) =>
			handlePrivateMessage(waku, msg, groupChatId),
		)
	}
}

async function handlePrivateMessage(waku: LightNode, msg: DecodedMessage, chatId: string) {
	const decodedPayload = decodeMessagePayload(msg)
	const chatMessage = JSON.parse(decodedPayload) as Message

	const emoji = chatMessage.fromAddress === BOT_ADDRESS ? '🤖' : '🧑'
	console.debug(emoji, { chatMessage })

	switch (chatMessage.type) {
		case 'invite':
			return handleInviteMessage(waku, chatMessage)
		case 'user':
			return handleUserMessage(waku, chatMessage, chatId)
		default:
			console.error('unknown message type', { chatMessage })
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requestBot(text: string, fromAddress: string, history?: any) {
	console.debug(`🕓 requesting bot...`)
	const request = {
		user_input: text,
		max_new_tokens: 200,
		character: BOT_CHARACTER,
		mode: 'chat',
		auto_max_new_tokens: true,
		history,
		regenerate: false,
		_continue: false,
		your_name: fromAddress,
		preset: BOT_PRESET,
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = (await axios.post(BOT_ENDPOINT, request)) as unknown as any
	history = response?.data?.results?.[0]?.history
	const responseText = history?.visible?.slice(-1)?.[0]?.[1]
	console.debug('🤖', { responseText })

	return {
		response,
		history,
		responseText,
	}
}

async function handleUserMessage(waku: LightNode, chatMessage: UserMessage, chatId: string) {
	if (isGroupChatId(chatId)) {
		// ignore messages from self
		if (chatMessage.fromAddress === BOT_ADDRESS) {
			console.debug('🙈 ignoring messages from self')
			return
		}
		// ignore messages not addressed to bot
		if (!chatMessage.text.startsWith(`@${BOT_NAME}`)) {
			console.debug('🙈 ignoring messages not addressed to me')
			return
		}
		return handleSessionUserMessage(waku, chatMessage, chatId)
	}
	return handleSessionUserMessage(waku, chatMessage, chatMessage.fromAddress)
}

async function handleSessionUserMessage(waku: LightNode, chatMessage: UserMessage, chatId: string) {
	const sessionHistory = sessions.get(chatId)

	const { history, responseText } = await requestBot(
		chatMessage.text,
		chatMessage.fromAddress,
		sessionHistory,
	)

	if (history?.visible?.length > BOT_HISTORY_LIMIT) {
		history.visible.shift()
		history.internal.shift()
	}

	sessions.set(chatId, history)

	sendMessage(waku, chatId, {
		type: 'user',
		timestamp: Date.now(),
		text: responseText,
		fromAddress: BOT_ADDRESS,
	})

	speak(responseText)
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

	await subscribe(waku, 'private-message', message.chatId, (msg) =>
		handlePrivateMessage(waku, msg, message.chatId),
	)
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
	try {
		const input = decodeHTML(text)
		child_process.spawn('speak-piper', [input], { detached: true }).on('error', () => {
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

main().catch(console.error)