import type { Adapter } from '$lib/adapters'
import { Contract, type BaseWallet, type TransactionReceipt, Interface } from 'ethers'
import type { WakuObjectAdapter } from '.'
import {
	defaultBlockchainNetwork,
	getProvider,
	getTransactionReceipt,
	getTransactionResponse,
	getTransactionTimestamp,
	waitForTransaction,
} from '$lib/adapters/transaction'
import type { TokenAmount, Transaction, TransactionState } from './schemas'
import { checkBalance } from '$lib/adapters/balance'
import abi from '$lib/abis/erc20.json'

const NUM_CONFIRMATIONS = 2

export function makeWakuObjectAdapter(adapter: Adapter, wallet: BaseWallet): WakuObjectAdapter {
	const { address } = wallet

	function sendTransaction(to: string, token: TokenAmount) {
		return adapter.sendTransaction(wallet, to, token)
	}

	function estimateTransaction(to: string, token: TokenAmount) {
		return adapter.estimateTransaction(wallet, to, token)
	}

	async function _checkBalance(token: TokenAmount): Promise<void> {
		await checkBalance(address, token)
	}

	async function getTransaction(txHash: string): Promise<Transaction | undefined> {
		const tx = await getTransactionResponse(txHash)
		if (!tx) {
			throw new Error(`Transaction not found. ${txHash}}`)
		}
		const from = tx.from
		const nonNativeToken = defaultBlockchainNetwork.tokens?.find((t) => t.address === tx.to)

		let token: TokenAmount
		let to: string

		if (nonNativeToken && tx.to) {
			const contract = new Contract(tx.to, abi)
			const parsedTransaction = contract.interface.parseTransaction({ data: tx.data })
			if (!parsedTransaction) throw new Error('Could not parse transaction')

			to = parsedTransaction.args[0]
			const amount = parsedTransaction.args[1]

			token = {
				...nonNativeToken,
				amount: amount,
			}
		} else {
			token = {
				...defaultBlockchainNetwork.nativeToken,
				amount: tx.value,
			}
			to = tx.to ?? ''
		}
		let feeAmount = 0n
		if (tx.maxFeePerGas && tx.maxPriorityFeePerGas)
			feeAmount = tx.gasLimit * tx.maxFeePerGas + tx.gasLimit * tx.maxPriorityFeePerGas
		else if (tx.gasPrice) feeAmount = tx.gasLimit * tx.gasPrice

		let timestamp: number = Date.now()
		if (tx.blockNumber) {
			try {
				timestamp = await getTransactionTimestamp(tx.blockNumber)
			} catch (error) {
				// TODO: review if this can silently fail or if we should throw
				console.error(error)
			}
		}

		return {
			timestamp,
			hash: txHash,
			from,
			to,
			fee: {
				...defaultBlockchainNetwork.nativeToken,
				amount: feeAmount.toString(),
			},
			token: { ...token, amount: token.amount.toString() },
		}
	}

	async function transactionReceiptToState(
		receipt: TransactionReceipt | null,
		confirms: number | undefined = NUM_CONFIRMATIONS,
	): Promise<TransactionState> {
		if (!receipt) {
			return 'unknown'
		}

		const confirmations = await receipt.confirmations()
		if (confirmations < confirms) {
			return 'pending'
		}

		if (receipt.status !== null) {
			if (receipt.status === 0) {
				return 'reverted'
			}
			if (receipt.status === 1) {
				return 'success'
			}
		}

		return 'unknown'
	}

	async function getTransactionState(txHash: string): Promise<TransactionState> {
		const receipt = await getTransactionReceipt(txHash)
		return transactionReceiptToState(receipt)
	}

	async function _waitForTransaction(txHash: string): Promise<TransactionState> {
		const receipt = await waitForTransaction(txHash, NUM_CONFIRMATIONS)
		return transactionReceiptToState(receipt)
	}

	function getContract(address: string, abi: Interface): Contract {
		const provider = getProvider()
		const txWallet = wallet.connect(provider)

		return new Contract(address, abi, txWallet)
	}

	return {
		getTransaction,
		getTransactionState,
		waitForTransaction: _waitForTransaction,
		checkBalance: _checkBalance,
		sendTransaction,
		estimateTransaction,
		getContract,
	}
}
