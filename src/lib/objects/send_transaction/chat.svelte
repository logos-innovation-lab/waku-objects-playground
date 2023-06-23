<script lang="ts">
	import { SendTransactionSchema, type MessageDataSend, MessageDataSendSchema } from './schemas'
	import type { WakuObjectArgs } from '..'
	import type { SendTransaction } from './schemas'
	import type { DataMessage } from '$lib/stores/chat'

	export let message: DataMessage | undefined = undefined
	export let args: WakuObjectArgs

	console.log(message, args)

	// Don't need to do this, everything should be in the message itself
	let store: SendTransaction
	$: {
		const res = SendTransactionSchema.safeParse(args.store)
		if (res.success) {
			store = res.data
		} else {
			console.error(res.error)
		}
	}
	let data: MessageDataSend
	$: {
		const res = MessageDataSendSchema.safeParse(message?.data)
		if (res.success) {
			data = res.data
		} else {
			console.error(res.error)
		}
	}
</script>

{#if !store}
	<!-- This is an error state -->
	<p>no store</p>
{:else if data.from === store.from}
	You sent {data.amount} {data.token} to {data.to}
{:else}
	You received {data.amount} {data.token} from {data.from}
{/if}
