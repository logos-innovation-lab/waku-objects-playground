import type { WakuObjectDescriptor } from '..'
import ChatComponent from './chat.svelte'
import { MessageDataSendSchema } from './schemas'
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
		if (message?.data) {
			const res = MessageDataSendSchema.safeParse(message.data)
			if (res.success) {
				const state = await adapter.getTransactionState(res.data.hash)
				if (state === 'pending' || state === 'success') {
					console.debug('onMessage', { state })
					const tx = await adapter.getTransaction(res.data.hash)

					console.debug('onMessage', { state, tx })

					updateStore(() => ({
						type: state,
						transaction: tx,
						hash: res.data.hash,
					}))

					const token = {
						...tx.token,
						name: tx.token.symbol,
						amount: BigInt(0), // the amount is not really necessary for checkBalance
					}

					await adapter.checkBalance(token)
				} else if (state === 'reverted') {
					const tx = await adapter.getTransaction(res.data.hash)
					updateStore(() => ({
						type: 'error',
						transaction: tx,
						error: 'Transaction has failed!',
					}))
				}
			}
		}
	},
}
