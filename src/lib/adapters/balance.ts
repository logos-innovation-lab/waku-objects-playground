import { balanceStore, type Token } from '$lib/stores/balances'
import { defaultBlockchainNetwork, getBalance } from '$lib/adapters/transaction'

export async function fetchBalances(address: string): Promise<void> {
	balanceStore.update((state) => ({
		...state,
		loading: true,
	}))

	const nativeTokenAmount = await getBalance(address)

	const ethData = {
		...defaultBlockchainNetwork.nativeToken,
		amount: nativeTokenAmount,
	}

	const daiData = {
		name: 'Dai',
		symbol: 'DAI',
		decimals: 18,
		amount: 7843900000000000000000n,
		image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
	}

	const balances = [ethData, daiData]
	const balancesState = {
		balances,
		loading: false,
	}
	balanceStore.set(balancesState)
}

export async function checkBalance(address: string, token: Token): Promise<void> {
	const nativeTokenAmount = await getBalance(address)

	balanceStore.update((balanceState) => ({
		...balanceState,
		balances: balanceState.balances.map((value) => {
			if (value.symbol !== token.symbol) {
				return value
			} else {
				return {
					...value,
					amount: nativeTokenAmount,
				}
			}
		}),
	}))
}
