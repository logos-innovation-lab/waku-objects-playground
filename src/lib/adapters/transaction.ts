import type { Token } from '$lib/objects/schemas'
import {
	JsonRpcProvider,
	type BaseWallet,
	type TransactionRequest,
	TransactionReceipt,
	type Provider,
	TransactionResponse,
} from 'ethers'

interface BlockchainNetwork {
	name: string
	provider: string
	nativeToken: Token
	tokens?: Token[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const testBlockchain: BlockchainNetwork = {
	name: 'Local testnet',
	provider: 'http://127.0.0.1:8545',
	nativeToken: {
		name: 'Test Ether',
		symbol: 'ETH',
		decimals: 18,
		image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
		amount: BigInt(0),
	},
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const chiadoBlockchain: BlockchainNetwork = {
	name: 'Chiado testnet',
	// provider: 'https://rpc.chiadochain.net/',
	// provider: 'https://rpc.chiado.gnosis.gateway.fm',
	provider: 'https://rpc.chiado.apyos.dev/',
	nativeToken: {
		name: 'Chiado xDai',
		symbol: 'xDai',
		decimals: 18,
		image: 'https://docs.gnosischain.com/img/tokens/chiado-xdai.png',
		amount: BigInt(0),
	},
	tokens: [
		{
			name: 'Chiado GNO',
			symbol: 'GNO',
			decimals: 18,
			image: 'https://docs.gnosischain.com/img/tokens/gno.png',
			amount: BigInt(0),
			address: '0x19C653Da7c37c66208fbfbE8908A5051B57b4C70',
		},
	],
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sepoliaBlockchain: BlockchainNetwork = {
	name: 'Sepolia testnet',
	// provider: 'https://rpc.sepolia.org/',
	provider: 'https://rpc2.sepolia.org/ ',
	nativeToken: {
		name: 'Sepolia ETH',
		symbol: 'SEP',
		decimals: 18,
		image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
		amount: BigInt(0),
	},
}

export const defaultBlockchainNetwork = chiadoBlockchain

export function getProvider(): Provider {
	const providerUrl = defaultBlockchainNetwork.provider
	const provider = new JsonRpcProvider(providerUrl)
	return provider
}

export async function sendTransaction(
	wallet: BaseWallet,
	to: string,
	amount: bigint,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	fee: bigint,
): Promise<TransactionResponse> {
	const provider = getProvider()
	const txWallet = wallet.connect(provider)

	const txRequest: TransactionRequest = {
		to,
		value: amount,
	}

	const tx = await txWallet.sendTransaction(txRequest)

	return tx
}

export async function waitForTransaction(
	txHash: string,
	confirm?: number | undefined,
): Promise<TransactionReceipt | null> {
	const provider = getProvider()
	const receipt = provider.waitForTransaction(txHash, confirm)
	return receipt
}

export async function getBalance(address: string): Promise<bigint> {
	const provider = getProvider()
	const balance = provider.getBalance(address)
	return balance
}

export async function getTransactionResponse(txHash: string): Promise<TransactionResponse | null> {
	const provider = getProvider()
	const tx = await provider.getTransaction(txHash)
	return tx
}

export async function getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
	const provider = getProvider()
	const receipt = await provider.getTransactionReceipt(txHash)
	return receipt
}
