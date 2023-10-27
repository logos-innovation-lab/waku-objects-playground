import type { WakuObjectArgs, WakuObjectSvelteDescriptor } from '..'
import ChatComponent from './chat.svelte'
import { DataMessageSchema, type DataMessage, type Store, type Balance } from './schemas'
import type { DataMessage as DM } from '$lib/stores/chat'
import StandaloneComponent from './standalone.svelte'
import logo from './logo.svg'
import type { View } from './types'
import { getBalances } from './blockchain'
import { defaultBlockchainNetwork } from '$lib/adapters/transaction'

export const SPLIT_OBJECT_ID = 'split'

export const SPLIT_TOKEN = defaultBlockchainNetwork.nativeToken

const onMessage = async (
	message: DM<DataMessage>,
	args: WakuObjectArgs<Store, DataMessage, View>,
) => {
	const res = DataMessageSchema.safeParse(message.data)
	if (!res.success) {
		args.addError({
			title: 'Message error',
			message: `Failed to process message. ${res.error.message}`,
			retry: () => onMessage(message, args),
		})
		return
	}

	if (res.data.type === 'expense') {
		const { expense, splitterAddress, tokenAddress, users } = res.data

		const token = args.tokens.find((t) => t.address === tokenAddress) ?? SPLIT_TOKEN
		let balances: Balance[] = []
		try {
			balances = await getBalances(args.getContract, splitterAddress)
		} catch (error) {
			args.addError({
				title: 'Message error',
				message: `Failed to process message. Could not fetch balances. ${
					(error as Error)?.message
				}`,
				retry: () => onMessage(message, args),
			})
			return
		}

		args.updateStore((s) => {
			const expenses = s?.expenses ?? []
			const payments = s?.payments ?? []

			expenses.push(expense)

			return {
				token,
				splitterAddress,
				users,
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
			args.addError({
				title: 'Message error',
				message: `Failed to process message. Could not fetch balances. ${
					(error as Error)?.message
				}`,
				retry: () => onMessage(message, args),
			})
			return
		}

		args.updateStore((s) => {
			const expenses = s?.expenses ?? []
			const payments = s?.payments ?? []
			const token = s?.token ?? SPLIT_TOKEN
			const users = s?.users ?? []

			payments.push(payment)

			return {
				token,
				splitterAddress,
				users,
				payments,
				balances,
				expenses,
			}
		})
	}
}

export const splitDescriptor: WakuObjectSvelteDescriptor<Store, DataMessage, View> = {
	objectId: SPLIT_OBJECT_ID,
	name: 'Split',
	description: 'Share expenses within a group',
	logo,

	wakuObject: ChatComponent,

	standalone: StandaloneComponent,
	onMessage,
}
