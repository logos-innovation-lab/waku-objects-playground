// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'

import child_process from 'child_process'

async function main() {
	const waku = await connectWaku()
	console.log({ waku })

	const botAddress = '0x1190ff60748db04e0457593c94219ccf739374d5'
	// const yourAddress = '0xf24e1D920d552AF5075163238135850AA8ea4eB7'

	const botProfile = {
		name: 'Bot',
		avatar: 'QmahJdru5ooiPrn8FipC7tLb2t9o39Kdszohk2g5SFffnQ', // IPFS hash of image comes here
	}
	await storeDocument(waku, 'profile', botAddress, botProfile)

	// const text = 'hello, I am Bot, ask me anything'
	// await sendMessage(waku, yourAddress, {
	// 	type: 'user',
	// 	timestamp: Date.now(),
	// 	text,
	// 	fromAddress: botAddress,
	// })

	await subscribe(waku, 'private-message', botAddress, async (msg) => {
		const decodedPayload = decodeMessagePayload(msg)
		const chatMessage = JSON.parse(decodedPayload) as { text: string; fromAddress: string }

		console.log({ chatMessage })

		const response = 'Let me think about it for a sec...'
		await sendMessage(waku, chatMessage.fromAddress, {
			type: 'user',
			timestamp: Date.now(),
			text: response,
			fromAddress: botAddress,
		})

		const output = child_process.spawnSync(
			'/home/attila/Projects/randomshit/ollama/ollama',
			['run', 'llama2-uncensored'],
			{ input: chatMessage.text },
		)
		sendMessage(waku, chatMessage.fromAddress, {
			type: 'user',
			timestamp: Date.now(),
			text: output.stdout.toString('utf-8'),
			fromAddress: botAddress,
		})
	})
}

main().catch(console.error)
