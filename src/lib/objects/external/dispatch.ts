import type { DataMessage } from '$lib/stores/chat'
import type { JSONSerializable, WakuObjectAdapter } from '..'
import type { Token } from '../schemas'

interface AdapterRequestMessage {
	type: 'adapter'
	function: string
	id: string
	args: string[]
}

interface AdapterResponseMessage {
	type: 'adapter'
	id: string
	result: unknown
}

export interface IframeDataMessage {
	type: 'on-message'
	address: string
	store: JSONSerializable
	message: DataMessage
}

interface IframeDispatcher {
	onMessage: (data: unknown, window: Window) => Promise<void>
}

export function makeIframeDispatcher(adapter: WakuObjectAdapter): IframeDispatcher {
	function postMessage(id: string, result: unknown, window: Window) {
		const response: AdapterResponseMessage = {
			type: 'adapter',
			id,
			result,
		}

		console.debug('IframeDispatcher.postMessage', { response, window })

		window.postMessage(response, { targetOrigin: '*' })
	}

	async function onMessage(data: unknown, window: Window) {
		// TODO validation
		const request = data as AdapterRequestMessage
		try {
			switch (request.function) {
				case 'getTransaction': {
					const response = await adapter.getTransaction(request.args[0])
					postMessage(request.id, response, window)
					return
				}
				case 'getTransactionState': {
					const response = await adapter.getTransactionState(request.args[0])
					postMessage(request.id, response, window)
					return
				}
				case 'waitForTransaction': {
					const response = await adapter.waitForTransaction(request.args[0])
					postMessage(request.id, response, window)
					return
				}
				case 'checkBalance': {
					// TODO validation
					const token = JSON.parse(request.args[0]) as Token
					const response = await adapter.checkBalance(token)
					postMessage(request.id, response, window)
					return
				}
				case 'sendTransaction': {
					const to = request.args[0]
					// TODO validation
					const token = JSON.parse(request.args[1]) as Token
					const response = await adapter.sendTransaction(to, token)
					postMessage(request.id, response, window)
					return
				}
				case 'estimateTransaction': {
					const to = request.args[0]
					// TODO validation
					const token = JSON.parse(request.args[1]) as Token
					const response = await adapter.estimateTransaction(to, token)
					postMessage(request.id, response, window)
					return
				}
				default: {
					const error = new Error(`not implemented: ${request.function}`)
					console.error(error)
					postMessage(request.id, error, window)
					return
				}
			}
		} catch (e) {
			console.error({ e })
			postMessage(request.id, e, window)
			return
		}
	}

	return {
		onMessage,
	}
}
