import { balanceStore, type TokenAmount } from '$lib/stores/balances'
import { defaultBlockchainNetwork, getBalance, getProvider } from '$lib/adapters/transaction'
import { Contract } from 'ethers'
import abi from '$lib/abis/erc20.json'

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

	const tokens = defaultBlockchainNetwork.tokens?.map((t) => ({ ...t, amount: 0n })) ?? []

	for (const token of tokens) {
		// We skip tokens that have no address (likely native tokens)
		if (!token.address) return

		const contract = new Contract(token.address, abi, getProvider())
		const tokenAmount = await contract.balanceOf(address)
		token.amount = tokenAmount
	}

	const balances = [ethData, ...tokens]
	const balancesState = {
		balances,
		loading: false,
	}
	balanceStore.set(balancesState)
}

export async function checkBalance(address: string, token: TokenAmount): Promise<void> {
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
