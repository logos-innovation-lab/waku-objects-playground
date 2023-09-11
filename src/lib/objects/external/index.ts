import type { WakuObjectSvelteDescriptor } from '..'
import type { IframeDataMessage } from './dispatch'
import ChatComponent from './chat.svelte'
import StandaloneComponent from './standalone.svelte'

const instanceWindowMap = new Map<string, Window>()

export const getExternalDescriptor = (
	objectId: string,
	name: string,
	description: string,
	logo: string,
	hasStandalone?: boolean,
): WakuObjectSvelteDescriptor => ({
	objectId,
	name,
	description,
	logo,
	wakuObject: ChatComponent,
	standalone: hasStandalone ? StandaloneComponent : undefined,
	onMessage: async (message, args) => {
		const iframeDataMessage: IframeDataMessage = {
			type: 'iframe-data-message',
			message,
			state: args,
		}
		postWindowMessage(message.instanceId, iframeDataMessage)
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

export function postWindowMessage(instanceId: string, message: unknown) {
	const window = instanceWindowMap.get(instanceId)
	if (window) {
		window.postMessage(message, { targetOrigin: '*' })
	}
}
