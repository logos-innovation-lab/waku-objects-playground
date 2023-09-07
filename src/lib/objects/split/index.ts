import type { WakuObjectSvelteDescriptor } from '..'
import ChatComponent from './chat.svelte'
import { DataMessageSchema, type DataMessage, type Store, type Balance } from './schemas'
import StandaloneComponent from './standalone.svelte'
import logo from './logo.svg'
import type { View } from './types'
import { getBalances } from './blockchain'
import { calculateAmountOwed } from './utils'

export const SPLIT_OBJECT_ID = 'split'

export const splitDescriptor: WakuObjectSvelteDescriptor<Store, DataMessage, View> = {
	objectId: SPLIT_OBJECT_ID,
	name: 'Split',
	description: 'Share expenses within a group',
	logo,

	wakuObject: ChatComponent,

	standalone: StandaloneComponent,

	onMessage: async (message, args) => {
		const res = DataMessageSchema.safeParse(message.data)
		if (!res.success) {
			console.error(res.error)
			return
		}

		if (res.data.type === 'expense') {
			const { expense, splitterAddress } = res.data

			let balances: Balance[] = []
			try {
				balances = await getBalances(args.getContract, splitterAddress)
			} catch (error) {
				console.error(error)

				const expenses = args.store?.expenses ?? []
				const payments = args.store?.payments ?? []

				expenses.push(expense)

				balances = calculateAmountOwed(expenses, payments, res.data.users)
			}

			args.updateStore((s) => {
				const expenses = s?.expenses ?? []
				const payments = s?.payments ?? []

				expenses.push(expense)

				return {
					splitterAddress,
					payments,
					balances,
					expenses,
				}
			})
		}

		if (res.data.type === 'payment') {
			const { payment, splitterAddress } = res.data

			let balances: Balance[] = []
			try {
				balances = await getBalances(args.getContract, splitterAddress)
			} catch (error) {
				console.error(error)

				const expenses = args.store?.expenses ?? []
				const payments = args.store?.payments ?? []
				const blnc = args.store?.balances ?? []

				payments.push(payment)

				balances = calculateAmountOwed(
					expenses,
					payments,
					blnc.map((b) => b.address),
				)
			}

			args.updateStore((s) => {
				const expenses = s?.expenses ?? []
				const payments = s?.payments ?? []

				payments.push(payment)

				return {
					splitterAddress,
					payments,
					balances,
					expenses,
				}
			})
		}
	},
}
