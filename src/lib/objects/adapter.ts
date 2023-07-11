import type { Adapter } from '$lib/adapters'
import type { BaseWallet } from 'ethers'
import type { WakuObjectAdapter } from '.'
import type { Token } from '$lib/stores/balances'

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

	return {
		checkBalance,
		sendTransaction,
		estimateTransaction,
	}
}
