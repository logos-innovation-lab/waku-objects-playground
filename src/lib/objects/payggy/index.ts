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

	onMessage: (address, adapter, store, message) => {
		if (message?.data) {
			const res = MessageDataSendSchema.safeParse(message.data)
			if (res.success) {
				const token = {
					...res.data.token,
					name: res.data.token.symbol,
					amount: BigInt(0), // the amount is not really necessary for checkBalance
				}
				adapter.checkBalance(token)
			}
		}

		return message.data
	},
}
