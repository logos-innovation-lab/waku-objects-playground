import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
import type { Balance, Expense, Payment } from './schemas'

// This is a fallback if we fail to load from the blockchain
export function calculateAmountOwed(
	expenses: Expense[],
	payments: Payment[],
	users: string[],
): Balance[] {
	const usersAndAmounts: Map<string, bigint> = new Map()
	const decimals = defaultBlockchainNetwork.nativeToken.decimals

	expenses.forEach((e) => {
		const amount = BigInt(e.amount)
		const perUserAmount = amount / BigInt(users.length)

		users.forEach((address) => {
			let newAmount = usersAndAmounts.get(address) ?? 0n

			// This was paid by me, add positive amount
			if (address === e.paidBy) newAmount += amount

			newAmount -= perUserAmount

			usersAndAmounts.set(address, newAmount)
		})
	})

	payments.forEach((p) => {
		const paidAmount = BigInt(p.amount)

		let newAmount = usersAndAmounts.get(p.paidBy) ?? 0n
		newAmount += paidAmount

		usersAndAmounts.set(p.paidBy, newAmount)

		let remainingAmount = paidAmount
		for (const [user, owedAmount] of usersAndAmounts) {
			if (owedAmount > 0n) {
				const amountToPay = owedAmount > remainingAmount ? remainingAmount : owedAmount
				remainingAmount -= amountToPay
				usersAndAmounts.set(user, owedAmount - amountToPay)
			}
			if (remainingAmount <= 0) break
		}
	})

	return users.map((address) => ({
		address,
		decimals,
		amount: (usersAndAmounts.get(address) ?? 0n).toString(),
	}))
}

// const splitterAddress = await splitterAddressPromise
export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
