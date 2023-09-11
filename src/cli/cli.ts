// run with `pnpm cli`

import { Wallet, formatUnits, parseEther } from 'ethers'
import {
	defaultBlockchainNetwork,
	getBalance,
	getProvider,
	getTransactionReceipt,
	getTransactionResponse,
	sendTransaction,
} from '../lib/adapters/transaction'
import { connectWaku, sendMessage } from '$lib/adapters/waku/waku'
import { makeWakustore } from '$lib/adapters/waku/wakustore'
import type { StorageProfile } from '$lib/adapters/waku/types'
import type { Message } from '$lib/stores/chat'
import { PageDirection } from '@waku/interfaces'

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
		profile,
		'group-chats': groupChats,
		chats,
		'private-message': privateMessage,
		objects,
		send,
		invite,
	}

	const fn = commands[command]
	if (!fn) {
		throw `unknown command: ${command}\nUsage: cli waku ${Object.keys(commands).join('|')}`
	}

	await fn(...restArgs)
}

async function profile(address: string) {
	if (!address) {
		throw `usage: profile <address>`
	}

	const waku = await connectWaku()
	const ws = makeWakustore(waku)

	const profile = await ws.getDoc<StorageProfile>('profile', address)
	console.log({ profile })
}

async function groupChats(address: string) {
	if (!address) {
		throw `usage: group-chats <address>`
	}

	const waku = await connectWaku()
	const ws = makeWakustore(waku)

	const result = await ws.getDoc('group-chats', address)
	console.log({ 'group-chats': result })
}

async function chats(address: string) {
	if (!address) {
		throw `usage: chats <address>`
	}

	const waku = await connectWaku()
	const ws = makeWakustore(waku)

	const chats = await ws.getDoc('chats', address)
	console.log({ chats })
}

async function privateMessage(address: string) {
	if (!address) {
		throw `usage: private-message <address>`
	}

	const waku = await connectWaku()
	const ws = makeWakustore(waku)
	const subscription = await ws.onSnapshot<Message>(
		ws.collectionQuery('private-message', address, {
			pageDirection: PageDirection.BACKWARD,
			pageSize: 10,
		}),
		console.log,
	)
	subscription()
}

async function objects(address: string) {
	if (!address) {
		throw `usage: objects <address>`
	}

	const waku = await connectWaku()
	const ws = makeWakustore(waku)

	const objects = await ws.getDoc('objects', address)
	console.log({ objects })
}

async function send(from: string, to: string, message: string) {
	if (!from || !to || !message) {
		throw `usage: send <from> <to> <message>`
	}

	const waku = await connectWaku()

	await sendMessage(waku, to, {
		type: 'user',
		fromAddress: from,
		text: message,
		timestamp: Date.now(),
	})
}

async function invite(from: string, to: string, chatId: string) {
	if (!from || !to || !chatId) {
		throw `usage: invite <from> <to> chat-id>`
	}

	const waku = await connectWaku()

	await sendMessage(waku, to, {
		type: 'invite',
		fromAddress: from,
		chatId,
		timestamp: Date.now(),
	})
}

main().catch(console.error)
