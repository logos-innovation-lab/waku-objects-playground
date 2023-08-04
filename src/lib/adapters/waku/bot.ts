// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { connectWaku, decodeMessagePayload, sendMessage, storeDocument, subscribe } from './waku'

import child_process from 'child_process'

const botAddress = process.argv[2] || process.env['BOT_ADDRESS']
const botProfile = {
	name: 'Bot',
	avatar: 'QmahJdru5ooiPrn8FipC7tLb2t9o39Kdszohk2g5SFffnQ', // IPFS hash of image comes here
}
const command = ['/home/attila/Projects/randomshit/ollama/ollama', 'run', 'llama2-uncensored']

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

		const response = 'Let me think about it for a sec...'
		await sendMessage(waku, chatMessage.fromAddress, {
			type: 'user',
			timestamp: Date.now(),
			text: response,
			fromAddress: botAddress,
		})

		const output = child_process.spawnSync(command[0], command.slice(1), {
			input: chatMessage.text,
		})
		sendMessage(waku, chatMessage.fromAddress, {
			type: 'user',
			timestamp: Date.now(),
			text: output.stdout.toString('utf-8'),
			fromAddress: botAddress,
		})
	})
}

main().catch(console.error)
