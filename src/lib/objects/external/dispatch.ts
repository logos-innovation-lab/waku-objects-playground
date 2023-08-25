import type { Adapter } from '$lib/adapters'
import type { DataMessage } from '$lib/stores/chat'
import type { HDNodeWallet } from 'ethers'
import type { JSONSerializable, WakuObjectAdapter, WakuObjectArgs, WakuObjectState } from '..'
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
	type: 'iframe-data-message'
	message: DataMessage
	state: WakuObjectState
}

interface IframeDispatcher {
	onMessage: (
		data: JSONSerializable,
		args: WakuObjectArgs,
		window: Window,
		wallet: HDNodeWallet,
	) => Promise<void>
}

export function makeIframeDispatcher(
	objectAdapter: WakuObjectAdapter,
	backendAdapter: Adapter,
): IframeDispatcher {
	function postResponse(id: string, result: unknown, window: Window) {
		const response: AdapterResponseMessage = {
			type: 'adapter',
			id,
			result,
		}

		console.debug('IframeDispatcher.postMessage', { response, window })

		window.postMessage(response, { targetOrigin: '*' })
	}

	async function onMessage(
		data: unknown,
		args: WakuObjectArgs,
		window: Window,
		wallet: HDNodeWallet,
	) {
		console.debug({ data })
		// TODO validation
		const request = data as AdapterRequestMessage
		try {
			switch (request.function) {
				case 'getTransaction': {
					const response = await objectAdapter.getTransaction(request.args[0])
					postResponse(request.id, response, window)
					return
				}
				case 'getTransactionState': {
					const response = await objectAdapter.getTransactionState(request.args[0])
					postResponse(request.id, response, window)
					return
				}
				case 'waitForTransaction': {
					const response = await objectAdapter.waitForTransaction(request.args[0])
					postResponse(request.id, response, window)
					return
				}
				case 'checkBalance': {
					// TODO validation
					const token = JSON.parse(request.args[0]) as Token
					const response = await objectAdapter.checkBalance(token)
					postResponse(request.id, response, window)
					return
				}
				case 'sendTransaction': {
					const to = request.args[0]
					// TODO validation
					const token = JSON.parse(request.args[1]) as Token
					const response = await objectAdapter.sendTransaction(to, token)
					postResponse(request.id, response, window)
					return
				}
				case 'estimateTransaction': {
					const to = request.args[0]
					// TODO validation
					const token = JSON.parse(request.args[1]) as Token
					const response = await objectAdapter.estimateTransaction(to, token)
					postResponse(request.id, response, window)
					return
				}
				case 'send': {
					const json = request.args[0]
					// TODO validation
					const data = JSON.parse(json) as JSONSerializable
					const response = await backendAdapter.sendData(
						wallet,
						args.chatId,
						args.objectId,
						args.instanceId,
						data,
					)
					postResponse(request.id, response, window)
					return
				}
				default: {
					const error = new Error(`not implemented: ${request.function}`)
					console.error(error)
					postResponse(request.id, error, window)
					return
				}
			}
		} catch (e) {
			console.error({ e })
			postResponse(request.id, e, window)
			return
		}
	}

	return {
		onMessage,
	}
}
