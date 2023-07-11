import type { WakuObjectDescriptor } from '..'
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
	//onMessage: (_address, _store, message) => message.data,
})
