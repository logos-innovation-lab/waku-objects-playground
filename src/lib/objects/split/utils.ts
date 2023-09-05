import type { Expense, Payment } from './schemas'

// TODO: REMOVE THIS. It should come from blockchain, no need to calculate it on client side
export function calculateAmountOwed(
	expenses: Expense[],
	payments: Payment[],
	users: string[],
): { address: string; amount: number }[] {
	const usersAndAmounts: Map<string, number> = new Map()

	expenses.forEach((e) => {
		const amount = Number(e.amount)
		const perUserAmount = amount / users.length

		users.forEach((address) => {
			let newAmount = usersAndAmounts.get(address) ?? 0

			// This was paid by me, add positive amount
			if (address === e.paidBy) newAmount += amount

			newAmount -= perUserAmount

			usersAndAmounts.set(address, newAmount)
		})
	})

	payments.forEach((p) => {
		const paidAmount = Number(p.amount)

		let newAmount = usersAndAmounts.get(p.paidBy) ?? 0
		newAmount += paidAmount

		usersAndAmounts.set(p.paidBy, newAmount)

		let remainingAmount = paidAmount
		for (const [user, owedAmount] of usersAndAmounts) {
			if (owedAmount > 0) {
				const amountToPay = Math.min(owedAmount, remainingAmount)
				remainingAmount -= amountToPay
				usersAndAmounts.set(user, owedAmount - amountToPay)
			}
			if (remainingAmount <= 0) break
		}
	})

	return users.map((address) => ({ address, amount: usersAndAmounts.get(address) ?? 0 }))
}

// const splitterAddress = await splitterAddressPromise
export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
