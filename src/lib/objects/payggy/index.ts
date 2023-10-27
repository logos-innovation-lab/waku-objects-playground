import type { WakuObjectArgs, WakuObjectSvelteDescriptor } from '..'
import ChatComponent from './chat.svelte'
import { SendTransactionDataMessageSchema } from './schemas'
import StandaloneComponent from './standalone.svelte'
import logo from './logo.svg'
import { errorStore } from '$lib/stores/error'
import type { DataMessage } from '$lib/stores/chat'

export const PAYGGY_OBJECT_ID = 'payggy'

const onMessage = async (message: DataMessage, args: WakuObjectArgs) => {
	if (!message?.data) {
		console.error('Invalid message, no data', message)
		return
	}

	const res = SendTransactionDataMessageSchema.safeParse(message.data)
	if (!res.success) {
		console.error('Invalid message', res.error.message)
		return
	}

	try {
		const tx = await args.getTransaction(res.data.hash)
		if (!tx) {
			throw new Error(`Transaction not found. ${res.data.hash}}`)
		}

		const state = await args.getTransactionState(res.data.hash)
		if (state === 'reverted') {
			args.updateStore(() => ({
				type: 'error',
				transaction: tx,
				error: 'Transaction has failed!',
			}))
			return
		}

		args.updateStore(() => ({
			type: state === 'success' ? 'success' : 'pending',
			transaction: tx,
			hash: res.data.hash,
		}))

		const token = {
			...tx.token,
			name: tx.token.symbol,
		}

		args.checkBalance(token)

		if (state === 'pending' || state === 'unknown') {
			args.waitForTransaction(res.data.hash).then((state) => {
				if (state === 'reverted') {
					args.updateStore(() => ({
						type: 'error',
						transaction: tx,
						error: 'Transaction has failed!',
					}))
					return
				}

				args.updateStore(() => ({
					type: state === 'success' ? 'success' : 'pending',
					transaction: tx,
					hash: res.data.hash,
				}))

				const token = {
					...tx.token,
					name: tx.token.symbol,
				}

				args.checkBalance(token)
			})
		}
	} catch (error) {
		errorStore.addEnd({
			title: 'Payggy message error',
			message: `Failed to process paygy message transaction details. ${(error as Error).message}`,
			retry: () => onMessage(message, args),
			reload: true,
		})
	}
}

export const payggyDescriptor: WakuObjectSvelteDescriptor = {
	objectId: PAYGGY_OBJECT_ID,
	name: 'Payggy',
	description: 'Send payments to chat members',
	logo,

	wakuObject: ChatComponent,

	standalone: StandaloneComponent,

	onMessage,
}
