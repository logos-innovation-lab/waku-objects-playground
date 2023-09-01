// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'
import axios from 'axios'

import child_process from 'child_process'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions = new Map<string, any>()

async function main() {
	if (!BOT_ADDRESS) {
		console.error(
			'please provide a bot address as argument or in the BOT_ADDRESS environment variable',
		)
		process.exit(1)
	}

	const waku = await connectWaku()

	console.debug('waku')

	await storeDocument(waku, 'profile', BOT_ADDRESS, botProfile)

	await subscribe(waku, 'private-message', BOT_ADDRESS, async (msg) => {
		console.debug('subscribe')
		const decodedPayload = decodeMessagePayload(msg)
		const chatMessage = JSON.parse(decodedPayload) as { text: string; fromAddress: string }

		console.log({ chatMessage })

		let history = sessions.get(chatMessage.fromAddress)

		const request = {
			user_input: chatMessage.text,
			max_new_tokens: 200,
			character: BOT_CHARACTER,
			mode: 'chat',
			auto_max_new_tokens: true,
			history: history,
			regenerate: false,
			_continue: false,
			your_name: chatMessage.fromAddress,
			preset: BOT_PRESET,
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = (await axios.post(BOT_ENDPOINT, request)) as unknown as any
		history = response?.data?.results?.[0]?.history
		const responseText = history?.visible?.slice(-1)?.[0]?.[1]
		console.debug({ responseText })

		if (history?.visible?.length > BOT_HISTORY_LIMIT) {
			history.visible.shift()
			history.internal.shift()
		}

		sessions.set(chatMessage.fromAddress, history)

		sendMessage(waku, chatMessage.fromAddress, {
			type: 'user',
			timestamp: Date.now(),
			text: responseText,
			fromAddress: BOT_ADDRESS,
		})

		speak(responseText)
	})
}

function speak(text: string) {
	try {
		const input = decodeHTML(text)
		child_process
			.spawn('speak-piper', [input], { detached: true })
			.on('error', () => console.error('speak failed'))
	} catch (e) {
		console.error('speak failed')
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
