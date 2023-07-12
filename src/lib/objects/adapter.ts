import type { Adapter } from '$lib/adapters'
import type { BaseWallet, TransactionReceipt } from 'ethers'
import type { WakuObjectAdapter } from '.'
import type { Token } from '$lib/stores/balances'
import {
	defaultBlockchainNetwork,
	getTransactionReceipt,
	getTransactionResponse,
	waitForTransaction,
} from '$lib/adapters/transaction'
import type { Transaction, TransactionState } from './schemas'
import { throwError } from '$lib/utils/error'

const NUM_CONFIRMATIONS = 5

export function makeWakuObjectAdapter(adapter: Adapter, wallet: BaseWallet): WakuObjectAdapter {
	const { address } = wallet

	function sendTransaction(to: string, token: Token, fee: Token) {
		return adapter.sendTransaction(wallet, to, token, fee)
	}

	function estimateTransaction(to: string, token: Token) {
		return adapter.estimateTransaction(wallet, to, token)
	}

	async function checkBalance(token: Token): Promise<void> {
		await adapter.checkBalance(address, token)
	}

	async function getTransaction(txHash: string): Promise<Transaction> {
		const tx = await getTransactionResponse(txHash)
		if (!tx) {
			throwError('transaction not found')
		}
		const from = tx.from
		const to = tx.to || ''
		const token = {
			...defaultBlockchainNetwork.nativeToken,
			amount: tx.value.toString(),
		}
		return {
			from,
			to,
			fee: {
				symbol: '',
				amount: '0', // has to be non-zero
				decimals: 18,
			},
			token,
		}
	}

	async function transactionReceiptToState(
		receipt: TransactionReceipt | null,
	): Promise<TransactionState> {
		if (!receipt) {
			return 'unknown'
		}
		const confirmations = await receipt.confirmations()
		if (confirmations < NUM_CONFIRMATIONS) {
			return 'pending'
		}

		console.debug({ receipt, confirmations })

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
		console.debug('getTransactionState', { receipt })
		return transactionReceiptToState(receipt)
	}

	async function _waitForTransaction(txHash: string): Promise<TransactionState> {
		const receipt = await waitForTransaction(txHash, NUM_CONFIRMATIONS)
		return transactionReceiptToState(receipt)
	}

	return {
		getTransaction,
		getTransactionState,
		waitForTransaction: _waitForTransaction,
		checkBalance,
		sendTransaction,
		estimateTransaction,
	}
}
