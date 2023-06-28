import type { WakuObjectDescriptor } from '..'
import ChatComponent from './chat.svelte'
import StandaloneComponent from './standalone.svelte'

export const SEND_TRANSACTION_OBJECT_ID = 'send-transaction'

export const sendTransactionDescriptor: WakuObjectDescriptor = {
	objectId: SEND_TRANSACTION_OBJECT_ID,

	wakuObject: ChatComponent,

	standalone: StandaloneComponent,

	onMessage: (address, store, message) => {
		return message.data
	},
}
