// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'
import axios from 'axios'

import { WebSocket } from 'ws'

import child_process from 'child_process'

const botAddress = process.argv[2] || process.env['BOT_ADDRESS']
const botProfile = {
	name: 'Daemon Zero',
	avatar: 'QmahJdru5ooiPrn8FipC7tLb2t9o39Kdszohk2g5SFffnQ', // IPFS hash of image comes here
}

const sessions = new Map<string, number[]>()

async function main() {
	if (!botAddress) {
		console.error(
			'please provide a bot address as argument or in the BOT_ADDRESS environment variable',
		)
		process.exit(1)
	}

	const waku = await connectWaku()

	await storeDocument(waku, 'profile', botAddress, botProfile)

	await subscribe(waku, 'private-message', botAddress, async (msg) => {
		const decodedPayload = decodeMessagePayload(msg)
		const chatMessage = JSON.parse(decodedPayload) as { text: string; fromAddress: string }

		console.log({ chatMessage })

		const waitResponse = '...'
		await sendMessage(waku, chatMessage.fromAddress, {
			type: 'user',
			timestamp: Date.now(),
			text: waitResponse,
			fromAddress: botAddress,
		})

		// const context = sessions.get(chatMessage.fromAddress)
		// const data = {
		// 	model: 'wakuchat',
		// 	prompt: chatMessage.text,
		// 	context,
		// }
		// const response = await axios.post(ollamaUrl, data)
		// console.debug({ response })

		const history = undefined

		const ws = new WebSocket('ws://149.36.0.147:46930/api/v1/chat-stream')
		const request = {
			user_input: chatMessage.text,
			max_new_tokens: 200,
			character: 'Sam Fox',
			mode: 'chat',
			auto_max_new_tokens: true,
			history: history,
			regenerate: false,
			_continue: false,
			preset: 'Yara',
			instruction_template: 'SamFox',
		}
		ws.on('open', () => {
			ws.send(JSON.stringify(request))
		})

		let responseText = ''
		ws.on('message', (event) => {
			// console.debug({ event })
			const json = event.toString('utf-8')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const jsonResponse = JSON.parse(json) as unknown as any
			console.debug({ jsonResponse })
			console.debug({ response: responseText })
			if (jsonResponse.event === 'text_stream') {
				responseText = jsonResponse.history.visible[0][1]
			} else if (jsonResponse.event === 'stream_end') {
				sendMessage(waku, chatMessage.fromAddress, {
					type: 'user',
					timestamp: Date.now(),
					text: responseText,
					fromAddress: botAddress,
				})

				speak(responseText)
			}
		})

		// const responseText = (response.data as string)
		// 	.split('\n')
		// 	.filter((part) => part)
		// 	.map((part: string) => JSON.parse(part) as { response: string })
		// 	.filter((obj) => obj.response)
		// 	.map((obj) => obj.response)
		// 	.join('')
		// 	.trimStart()

		// const responseContext = (response.data as string)
		// 	.split('\n')
		// 	.filter((part) => part)
		// 	.map((part: string) => JSON.parse(part) as { context: number[] })
		// 	.filter((obj) => obj.context)
		// 	.map((obj) => obj.context)
		// 	.toString()

		// console.debug({ responseText, responseContext })

		// sessions.set(chatMessage.fromAddress, JSON.parse('[' + responseContext + ']') as number[])

		// sendMessage(waku, chatMessage.fromAddress, {
		// 	type: 'user',
		// 	timestamp: Date.now(),
		// 	text: responseText,
		// 	fromAddress: botAddress,
		// })

		// speak(responseText)
	})
}

function speak(text: string) {
	child_process.spawnSync('speak-piper', {
		input: text,
	})
}

main().catch(console.error)
