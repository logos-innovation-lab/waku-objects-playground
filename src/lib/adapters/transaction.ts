import {
	JsonRpcProvider,
	type BaseWallet,
	type TransactionRequest,
	TransactionReceipt,
	type TransactionResponseParams,
	type Provider,
} from 'ethers'

type SendTransactionResponse = TransactionResponseParams & {
	receipt: TransactionReceipt | null
}

interface BlockchainNetwork {
	nativeToken: string
	provider: string
}

const testBlockchain: BlockchainNetwork = {
	nativeToken: 'ETH',
	provider: 'http://127.0.0.1:8545',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const chiadoBlockchain: BlockchainNetwork = {
	nativeToken: 'XDAI',
	provider: 'https://rpc.chiadochain.net/',
}

export const defaultBlockchainNetwork = testBlockchain

function getProvider(): Provider {
	const providerUrl = defaultBlockchainNetwork.provider
	const provider = new JsonRpcProvider(providerUrl)
	return provider
}

export async function sendTransaction(
	wallet: BaseWallet,
	to: string,
	amount: bigint,
	fee: bigint,
): Promise<SendTransactionResponse> {
	const provider = getProvider()
	const txWallet = wallet.connect(provider)

	const txRequest: TransactionRequest = {
		to,
		value: amount,
	}

	const tx = await txWallet.sendTransaction(txRequest)
	const receipt = await tx.wait()

	return {
		...tx,
		receipt,
	}
}

export async function getBalance(address: string): Promise<bigint> {
	const provider = getProvider()
	const balance = provider.getBalance(address)
	return balance
}

export async function getSendTransactionResponse(hash: string): Promise<SendTransactionResponse> {
	const provider = getProvider()
	const tx = await provider.getTransaction(hash)
	if (!tx) {
		throw 'transaction not found'
	}
	const receipt = await provider.getTransactionReceipt(hash)
	return {
		...tx,
		receipt,
	}
}
