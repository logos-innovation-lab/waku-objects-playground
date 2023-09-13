import type { WakuObjectSvelteDescriptor } from '..'
import ChatComponent from './chat.svelte'
import { DataMessageSchema, type DataMessage, type Store, type Balance } from './schemas'
import StandaloneComponent from './standalone.svelte'
import logo from './logo.svg'
import type { View } from './types'
import { getBalances } from './blockchain'
import { defaultBlockchainNetwork } from '$lib/adapters/transaction'

export const SPLIT_OBJECT_ID = 'split'

export const SPLIT_TOKEN = defaultBlockchainNetwork.nativeToken

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
			const { expense, splitterAddress, tokenAddress } = res.data

			const token = args.tokens.find((t) => t.address === tokenAddress) ?? SPLIT_TOKEN
			let balances: Balance[] = []
			try {
				balances = await getBalances(args.getContract, splitterAddress)
			} catch (error) {
				console.error(error)
			}

			args.updateStore((s) => {
				const expenses = s?.expenses ?? []
				const payments = s?.payments ?? []

				expenses.push(expense)

				return {
					token,
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
			}

			args.updateStore((s) => {
				const expenses = s?.expenses ?? []
				const payments = s?.payments ?? []
				const token = s?.token ?? SPLIT_TOKEN

				payments.push(payment)

				return {
					splitterAddress,
					token,
					payments,
					balances,
					expenses,
				}
			})
		}
	},
}
