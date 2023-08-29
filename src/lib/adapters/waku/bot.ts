// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'
import axios from 'axios'

import { WebSocket } from 'ws'

import child_process from 'child_process'

const host = '185.32.161.60'
const port = '42391'

const apiUrl = 'ws://185.32.161.60:42391/api/v1/chat-stream'

const httpApiUrl = `https://4ccbu3ko70ouza-5000.proxy.runpod.net/api/v1/chat`

const botAddress = process.argv[2] || process.env['BOT_ADDRESS']
const botProfile = {
	name: 'Victoria',
	avatar: 'QmWtTDsyZBGZPhEEe3fnA24Q3NirqEYqFMifMnHMZkoQ97', // IPFS hash of image comes here
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessions = new Map<string, any>()

async function main() {
	if (!botAddress) {
		console.error(
			'please provide a bot address as argument or in the BOT_ADDRESS environment variable',
		)
		process.exit(1)
	}

	const waku = await connectWaku()

	console.debug('waku')

	await storeDocument(waku, 'profile', botAddress, botProfile)

	await subscribe(waku, 'private-message', botAddress, async (msg) => {
		console.debug('subscribe')
		const decodedPayload = decodeMessagePayload(msg)
		const chatMessage = JSON.parse(decodedPayload) as { text: string; fromAddress: string }

		console.log({ chatMessage })

		// const waitResponse = '...'
		// await sendMessage(waku, chatMessage.fromAddress, {
		// 	type: 'user',
		// 	timestamp: Date.now(),
		// 	text: waitResponse,
		// 	fromAddress: botAddress,
		// })

		let history = sessions.get(botAddress) || { internal: [ [] ], visible: [ []]}

		const request = {
			user_input: chatMessage.text,
			max_new_tokens: 200,
			character: 'Victoria',
			mode: 'chat',
			auto_max_new_tokens: true,
			history: history,
			regenerate: false,
			_continue: true,
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
			fromAddress: botAddress,
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
