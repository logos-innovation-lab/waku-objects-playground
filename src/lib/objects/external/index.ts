import type { WakuObjectDescriptor } from '..'
import type { IframeDataMessage } from './dispatch'
import IframeComponent from './iframe.svelte'
import logo from './logo.svg'

export const SEND_TRANSACTION_OBJECT_ID = 'external'

export type CustomArgs = {
	name: string
}

export const getExternalDescriptor = (objectId: string): WakuObjectDescriptor => ({
	objectId,
	name: 'External',
	description: 'External',
	logo,
	wakuObject: IframeComponent,
	customArgs: { name: objectId },
	onMessage: async (address, _adapter, store, _updateStore, message) => {
		const iframeMessage: IframeDataMessage = {
			type: 'on-message',
			address,
			store,
			message,
		}
		window.postMessage(iframeMessage, { targetOrigin: '*' })
	},
})
