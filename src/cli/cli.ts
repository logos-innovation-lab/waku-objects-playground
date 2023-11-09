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

async function waku() {
	const command = process.argv[3]
	const restArgs = process.argv.slice(4)

	const commands: Record<string, (...args: string[]) => Promise<void>> = {}

	const fn = commands[command]
	if (!fn) {
		throw `unknown command: ${command}\nUsage: cli waku ${Object.keys(commands).join('|')}`
	}

	await fn(...restArgs)

	process.exit(0)
}

main().catch(console.error)
