<script lang="ts">
	import { SendTransactionSchema, type MessageDataSend, MessageDataSendSchema } from './schemas'
	import type { WakuObjectArgs } from '..'
	import type { SendTransaction } from './schemas'
	import type { DataMessage } from '$lib/stores/chat'
	import { formatTokenAmount } from '$lib/utils/format'

	export let message: DataMessage | undefined = undefined
	export let args: WakuObjectArgs

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
	You sent {formatTokenAmount(BigInt(data.token.amount), data.token.decimals)}
	{data.token.symbol} to {data.to}
{:else}
	You received {formatTokenAmount(BigInt(data.token.amount), data.token.decimals)}
	{data.token.symbol} from {data.from}
{/if}
