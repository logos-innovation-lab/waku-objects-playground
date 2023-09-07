import type { WakuObjectSvelteDescriptor } from '..'
import type { IframeDataMessage } from './dispatch'
import IframeComponent from './iframe.svelte'
import logo from './logo.svg'

const instanceWindowMap = new Map<string, Window>()

export const getExternalDescriptor = (objectId: string): WakuObjectSvelteDescriptor => ({
	objectId,
	name: 'External',
	description: 'External',
	logo,
	wakuObject: IframeComponent,
	customArgs: { name: objectId },
	onMessage: async (message, args) => {
		const window = instanceWindowMap.get(message.instanceId)
		if (!window) {
			return
		}

		const iframeDataMessage: IframeDataMessage = {
			type: 'iframe-data-message',
			message,
			state: args,
		}
		window.postMessage(iframeDataMessage, { targetOrigin: '*' })
	},
})

export function registerWindow(instanceId: string, window: Window) {
	if (instanceWindowMap.has(instanceId)) {
		return
	}

	instanceWindowMap.set(instanceId, window)
}

export function unregisterWindow(instanceId: string) {
	instanceWindowMap.delete(instanceId)
}