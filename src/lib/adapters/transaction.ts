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
// import { PUBLIC_BLOCKCHAIN } from '$env/static/public'

const PUBLIC_BLOCKCHAIN = 'gnosis'

interface BlockchainExplorer {
	name: string
	url: string
}

interface BlockchainNetwork {
	name: string
	chainId: bigint
	provider: string
	explorer?: BlockchainExplorer
	nativeToken: Token
	tokens?: Token[]
}

const localBlockchain: BlockchainNetwork = {
	name: 'Local testnet',
	chainId: 31337n,
	provider: 'http://127.0.0.1:8545',
	nativeToken: {
		name: 'Test Ether',
		symbol: 'ETH',
		decimals: 18,
		image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
	},
}

const chiadoBlockchain: BlockchainNetwork = {
	name: 'Chiado testnet',
	chainId: 10200n,
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
}

const gnosisBlockchain: BlockchainNetwork = {
	name: 'Gnosis',
	chainId: 100n,
	provider: 'https://gnosis-erigon.apyos.dev/',
	explorer: {
		name: 'Blockscout',
		url: 'https://gnosis.blockscout.com',
	},
	nativeToken: {
		name: 'xDai',
		symbol: 'xDai',
		decimals: 18,
		image: 'https://docs.gnosischain.com/img/tokens/xdai.png',
	},
	tokens: [
		{
			name: 'GNO',
			symbol: 'GNO',
			decimals: 18,
			image: 'https://docs.gnosischain.com/img/tokens/gno.png',
			address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
		},
	],
}

function getBlockchainNetwork(): BlockchainNetwork {
	switch (PUBLIC_BLOCKCHAIN) {
		case 'local':
			return localBlockchain

		case 'chiado':
			return chiadoBlockchain

		// Defaults to production
		case 'gnosis':
		default:
			return gnosisBlockchain
	}
}

export const defaultBlockchainNetwork = getBlockchainNetwork()

export function getProvider(): Provider {
	const providerUrl = defaultBlockchainNetwork.provider
	const provider = new JsonRpcProvider(providerUrl)
	return provider
}

export async function getChainId(): Promise<bigint> {
	const provider = getProvider()
	const { chainId } = await provider.getNetwork()
	return chainId
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

export async function estimateTransaction(
	wallet: BaseWallet,
	to: string,
	amount: bigint,
	tokenAddress?: string,
): Promise<bigint> {
	const provider = getProvider()
	const txWallet = wallet.connect(provider)

	let gasEstimate: bigint

	if (tokenAddress) {
		const contract = new Contract(tokenAddress, abi, txWallet)
		gasEstimate = await contract.transfer.estimateGas(to, amount)
	} else {
		const txRequest: TransactionRequest = {
			to,
			value: amount,
		}
		gasEstimate = await provider.estimateGas(txRequest)
	}
	const fee = await provider.getFeeData()

	if (fee.maxFeePerGas && fee.maxPriorityFeePerGas)
		return gasEstimate * (fee.maxFeePerGas + fee.maxPriorityFeePerGas)
	else if (fee.gasPrice) return gasEstimate * fee.gasPrice

	throw new Error('Could not estimate transaction fee')
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
