import type { Adapter } from '$lib/adapters'
import type { DataMessage } from '$lib/stores/chat'
import type { HDNodeWallet } from 'ethers'
import type {
	JSONSerializable,
	JSONValue,
	WakuObjectAdapter,
	WakuObjectArgs,
	WakuObjectContextProps,
	WakuObjectState,
} from '..'
import type { TokenAmount } from '../schemas'

interface AdapterRequestMessage {
	type: 'adapter'
	function: string
	id: string
	args: string[]
}

interface AdapterResponseSuccess {
	type: 'success'
	value: JSONSerializable | undefined
}

interface AdapterResponseError {
	type: 'error'
	value: unknown
}

type AdapterResponseResult = AdapterResponseSuccess | AdapterResponseError

interface AdapterResponseMessage {
	type: 'adapter'
	id: string
	result: AdapterResponseResult
}

export interface IframeDataMessage {
	type: 'iframe-data-message'
	message: DataMessage
	state: WakuObjectState
}

export interface IframeContextChange {
	type: 'iframe-context-change'
	state: WakuObjectState
	context: WakuObjectContextProps
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
	function postResponse(id: string, result: AdapterResponseResult, window: Window) {
		const response: AdapterResponseMessage = {
			type: 'adapter',
			id,
			result,
		}
		window.postMessage(response, { targetOrigin: '*' })
	}

	async function dispatch(
		request: AdapterRequestMessage,
		args: WakuObjectArgs,
		wallet: HDNodeWallet,
	): Promise<JSONSerializable | undefined> {
		switch (request.function) {
			case 'getTransaction': {
				const response = await objectAdapter.getTransaction(request.args[0])
				return response
			}
			case 'getTransactionState': {
				const response = await objectAdapter.getTransactionState(request.args[0])
				return response
			}
			case 'waitForTransaction': {
				const response = await objectAdapter.waitForTransaction(request.args[0])
				return response
			}
			case 'checkBalance': {
				// TODO validation
				const token = JSON.parse(request.args[0]) as TokenAmount
				await objectAdapter.checkBalance(token)
				return undefined
			}
			case 'sendTransaction': {
				const to = request.args[0]
				// TODO validation
				const token = JSON.parse(request.args[1]) as TokenAmount
				const response = await objectAdapter.sendTransaction(to, token)
				return response
			}
			case 'estimateTransaction': {
				const to = request.args[0]
				// TODO validation
				const token = JSON.parse(request.args[1]) as TokenAmount
				const response = await objectAdapter.estimateTransaction(to, token)
				// TODO proper types
				return response as unknown as JSONValue
			}
			case 'send': {
				const json = request.args[0]
				// TODO validation
				const data = JSON.parse(json) as JSONSerializable
				await backendAdapter.sendData(wallet, args.chatId, args.objectId, args.instanceId, data)
				return undefined
			}
			case 'getStore': {
				const store = args.store
				return store
			}
			case 'setStore': {
				const json = request.args[0]
				const data = JSON.parse(json) as JSONSerializable
				const updater = () => data
				args.updateStore(updater)
				return undefined
			}
			case 'onViewChange': {
				const view = request.args[0]
				args.onViewChange(view)
				return undefined
			}
			default: {
				throw `not implemented: ${request.function}`
			}
		}
	}

	async function onMessage(
		data: unknown,
		args: WakuObjectArgs,
		window: Window,
		wallet: HDNodeWallet,
	) {
		// TODO validation
		const request = data as AdapterRequestMessage
		try {
			const response = await dispatch(request, args, wallet)
			const result: AdapterResponseSuccess = {
				type: 'success',
				value: response,
			}
			postResponse(request.id, result, window)
		} catch (e) {
			console.error({ e })
			const result: AdapterResponseError = {
				type: 'error',
				value: e,
			}
			postResponse(request.id, result, window)
			return
		}
	}

	return {
		onMessage,
	}
}
