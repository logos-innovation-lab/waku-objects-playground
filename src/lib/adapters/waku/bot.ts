// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'
import axios from 'axios'

import child_process from 'child_process'

const BOT_HOST = process.env.BOT_HOST || '185.32.161.60'
const BOT_PORT = process.env.BOT_PORT || '42391'
const BOT_NAME = process.env.BOT_NAME || ''
const BOT_CHARACTER = process.env.BOT_CHARACTER || 'Wendy'
const BOT_AVATAR = process.env.BOT_AVATAR || 'QmWtTDsyZBGZPhEEe3fnA24Q3NirqEYqFMifMnHMZkoQ97'
const BOT_ADDRESS = process.env.BOT_ADDRESS || process.argv[2]

const httpApiUrl = `https://${BOT_HOST}:${BOT_PORT}/api/v1/chat`

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

		let history = undefined

		const request = {
			user_input: chatMessage.text,
			max_new_tokens: 200,
			character: BOT_CHARACTER,
			mode: 'chat',
			auto_max_new_tokens: true,
			history: history,
			regenerate: false,
			_continue: false,
			preset: 'Yara',
			// instruction_template: 'SamFox',
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = (await axios.post(httpApiUrl, request)) as unknown as any
		history = response?.data?.results?.[0]?.history
		console.debug({ response, history })
		const responseText = history?.visible?.[0]?.[1]

		console.debug({ responseText })

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
	child_process.spawnSync('speak-piper', {
		input: text,
	})
}

main().catch(console.error)
