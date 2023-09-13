import type { Token } from '$lib/objects/schemas'
import {
	JsonRpcProvider,
	type BaseWallet,
	type TransactionRequest,
	TransactionReceipt,
	type Provider,
	TransactionResponse,
	Contract,
} from 'ethers'
import abi from '$lib/abis/erc20.json'

interface BlockchainExplorer {
	name: string
	url: string
}

interface BlockchainNetwork {
	name: string
	provider: string
	explorer?: BlockchainExplorer
	nativeToken: Token
	tokens?: Token[]
	objects: {
		splitterFactory: string
	}
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
	},
	objects: {
		splitterFactory: '0x0',
	},
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const chiadoBlockchain: BlockchainNetwork = {
	name: 'Chiado testnet',
	provider: 'https://rpc.chiado.apyos.dev/',
	explorer: {
		name: 'Blockscout',
		url: 'https://gnosis-chiado.blockscout.com',
	},
	nativeToken: {
		name: 'Chiado xDai',
		symbol: 'xDai',
		decimals: 18,
		image: 'https://docs.gnosischain.com/img/tokens/chiado-xdai.png',
	},
	tokens: [
		{
			name: 'Chiado GNO',
			symbol: 'GNO',
			decimals: 18,
			image: 'https://docs.gnosischain.com/img/tokens/gno.png',
			address: '0x19C653Da7c37c66208fbfbE8908A5051B57b4C70',
		},
	],
	objects: {
		splitterFactory: '0x941DDB22a33FC753d3E7b82cc34c47Ee605e60a3',
	},
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sepoliaBlockchain: BlockchainNetwork = {
	name: 'Sepolia testnet',
	provider: 'https://rpc2.sepolia.org/ ',
	explorer: {
		name: 'Etherscan',
		url: 'https://sepolia.etherscan.io/',
	},
	nativeToken: {
		name: 'Sepolia ETH',
		symbol: 'SEP',
		decimals: 18,
		image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
	},
	objects: {
		splitterFactory: '0x0',
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
	tokenAddress?: string,
): Promise<TransactionResponse> {
	const provider = getProvider()
	const txWallet = wallet.connect(provider)

	let tx: TransactionResponse
	if (tokenAddress) {
		const contract = new Contract(tokenAddress, abi, txWallet)
		tx = await contract.transfer(to, amount)
	} else {
		const txRequest: TransactionRequest = {
			to,
			value: amount,
		}

		tx = await txWallet.sendTransaction(txRequest)
	}

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

export async function getTransactionTimestamp(blocknum: number): Promise<number> {
	const provider = getProvider()
	const block = await provider.getBlock(blocknum)
	return block?.timestamp ?? Date.now()
}
