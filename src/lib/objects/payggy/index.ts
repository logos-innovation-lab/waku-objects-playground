import type { WakuObjectDescriptor } from '..'
import ChatComponent from './chat.svelte'
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

	onMessage: (address, store, message) => {
		return message.data
	},
}
