import type { WakuObjectDescriptor } from '..'
import ChatComponent from './chat.svelte'
import { SendTransactionDataMessageSchema } from './schemas'
import StandaloneComponent from './standalone.svelte'
import logo from './logo.svg'

export const PAYGGY_OBJECT_ID = 'payggy'

export const payggyDescriptor: WakuObjectDescriptor = {
	objectId: PAYGGY_OBJECT_ID,
	name: 'Payggy',
	description: 'Send or request payments',
	logo,

	wakuObject: ChatComponent,

	standalone: StandaloneComponent,

	onMessage: async (address, adapter, store, updateStore, message) => {
		if (!message?.data) {
			return
		}

		const res = SendTransactionDataMessageSchema.safeParse(message.data)
		if (!res.success) {
			return
		}

		const tx = await adapter.getTransaction(res.data.hash)
		if (!tx) {
			return
		}

		const state = await adapter.getTransactionState(res.data.hash)
		if (state === 'reverted') {
			updateStore(() => ({
				type: 'error',
				transaction: tx,
				error: 'Transaction has failed!',
			}))
			return
		}

		updateStore(() => ({
			type: state === 'success' ? 'success' : 'pending',
			transaction: tx,
			hash: res.data.hash,
		}))

		const token = {
			...tx.token,
			name: tx.token.symbol,
			amount: BigInt(0), // the amount is not really necessary for checkBalance
		}

		adapter.checkBalance(token)

		if (state === 'pending' || state === 'unknown') {
			adapter.waitForTransaction(res.data.hash).then((state) => {
				if (state === 'reverted') {
					updateStore(() => ({
						type: 'error',
						transaction: tx,
						error: 'Transaction has failed!',
					}))
					return
				}

				updateStore(() => ({
					type: state === 'success' ? 'success' : 'pending',
					transaction: tx,
					hash: res.data.hash,
				}))

				const token = {
					...tx.token,
					name: tx.token.symbol,
					amount: BigInt(0), // the amount is not really necessary for checkBalance
				}

				adapter.checkBalance(token)
			})
		}
	},
}
