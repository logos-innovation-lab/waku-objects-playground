// run with `pnpm cli`

import { Wallet, formatUnits, parseEther } from 'ethers'
import {
	defaultBlockchainNetwork,
	getBalance,
	getProvider,
	getTransactionReceipt,
	getTransactionResponse,
	sendTransaction,
} from '$lib/adapters/transaction'
import { SafeWaku } from '$lib/adapters/waku/safe-waku'
import { hexToBytes } from '@waku/utils/bytes'
import { createSymmetricDecoder } from '$lib/adapters/waku/codec'
import { readStore, type QueryResult, decodeMessagePayload } from '$lib/adapters/waku/waku'
import type { DecodedMessage } from '@waku/message-encryption'
import type { ChatMessage } from '$lib/stores/chat'

async function main() {
	const command = process.argv[2]
	const restArgs = process.argv.slice(3)

	const commands: Record<string, (...args: string[]) => Promise<void>> = {
		fund,
		balance,
		txinfo,
		waku,
	}

	const fn = commands[command]
	if (!fn) {
		throw `unknown command: ${command}\nUsage: cli ${Object.keys(commands).join('|')}`
	}

	await fn(...restArgs)

	process.exit(0)
}

async function fund(address: string, amount = '1') {
	if (!address) {
		throw `usage: fund <address> [amount=1]`
	}
	console.log(`Funding address: ${address}`)
	// hardhat builtin wallet private key
	const wallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')

	const tx = await sendTransaction(wallet, address, parseEther(amount))

	console.log('tx done', { tx })
}

async function balance(address: string) {
	if (!address) {
		throw `usage: balance <address>`
	}
	const decimals = defaultBlockchainNetwork.nativeToken.decimals
	const symbol = defaultBlockchainNetwork.nativeToken.symbol
	const bal = await getBalance(address)
	console.log(`Network: ${defaultBlockchainNetwork.name}`)
	console.log(`Chain ID: ${(await getProvider().getNetwork()).chainId}`)
	console.log(`RPC provider: ${defaultBlockchainNetwork.provider}`)
	console.log(`Balance: ${formatUnits(bal.toString(), decimals)} ${symbol}`)
}

async function txinfo(hash: string) {
	if (!hash) {
		throw `usage: txinfo <hash>`
	}
	const tx = await getTransactionResponse(hash)
	const receipt = await getTransactionReceipt(hash)

	console.log({ tx, receipt })
}

async function waku(...args: string[]) {
	const command = args[0]
	const restArgs = args.slice(1)

	const commands: Record<string, (...args: string[]) => Promise<void>> = {
		list,
	}

	const fn = commands[command]
	if (!fn) {
		throw `unknown command: ${command}\nUsage: cli waku ${Object.keys(commands).join('|')}`
	}

	await fn(...restArgs)
}

async function list(chatId: string) {
	if (!chatId) {
		throw `usage: list <chatId>`
	}

	const safeWaku = new SafeWaku()
	const waku = await safeWaku.connect()
	const encryptionKey = hexToBytes(chatId)
	const decoder = createSymmetricDecoder({
		contentTopic: 'private-message',
		symKey: encryptionKey,
	})

	const chatMessages: ChatMessage[] = []

	const result = await readStore(waku, decoder)
	const messages = await getQueryResults(result)

	for (const message of messages) {
		const value = decodeDoc(message) as ChatMessage
		chatMessages.push(value)
	}

	console.log(
		chatMessages.length,
		chatMessages.map((message) =>
			message.type === 'babble'
				? `${message.id}: ${message.timestamp} ${message.text} ${message.parentId ?? ''}`
				: '',
		),
	)
}

async function getQueryResults(results: QueryResult): Promise<DecodedMessage[]> {
	const decodedMessages: DecodedMessage[] = []
	for await (const messagePromises of results) {
		for (const messagePromise of messagePromises) {
			const message = await messagePromise
			if (message) {
				decodedMessages.push(message)
			}
		}
	}
	return decodedMessages
}

function decodeDoc<T>(message: DecodedMessage): T {
	const decodedPayload = decodeMessagePayload(message)
	const typedPayload = JSON.parse(decodedPayload) as T

	return typedPayload
}

main().catch(console.error)
