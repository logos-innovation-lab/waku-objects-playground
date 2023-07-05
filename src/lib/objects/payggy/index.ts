import type { WakuObjectDescriptor } from '..'
import ChatComponent from './chat.svelte'
import StandaloneComponent from './standalone.svelte'

export const PAYGGY_OBJECT_ID = 'send-transaction'

export const sendTransactionDescriptor: WakuObjectDescriptor = {
	objectId: PAYGGY_OBJECT_ID,

	wakuObject: ChatComponent,

	standalone: StandaloneComponent,

	onMessage: (address, store, message) => {
		return message.data
	},
}
