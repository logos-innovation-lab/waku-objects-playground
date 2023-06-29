<script lang="ts">
	import { SendTransactionSchema, type MessageDataSend, MessageDataSendSchema } from './schemas'
	import type { WakuObjectArgs } from '..'
	import type { SendTransaction } from './schemas'
	import type { DataMessage } from '$lib/stores/chat'
	import { formatTokenAmount } from '$lib/utils/format'
	import ChatMessage from '$lib/components/chat-message.svelte'

	export let message: DataMessage<MessageDataSend>
	export let args: WakuObjectArgs<MessageDataSend, MessageDataSend>

	// Don't need to do this, everything should be in the message itself
	let store: SendTransaction
	$: if (args.store) {
		const res = SendTransactionSchema.safeParse(args.store)
		if (res.success) {
			store = res.data
		} else {
			console.error(res.error)
		}
	}
	let data: MessageDataSend
	$: if (message?.data) {
		const res = MessageDataSendSchema.safeParse(message.data)
		if (res.success) {
			data = res.data
		} else {
			console.error(res.error)
		}
	}
</script>

<ChatMessage myMessage bubble>
	{#if !args.store || !message.data}
		Loading...
	{:else if !store || !data}
		<!-- This is an error state -->
		Failed to parse store or message data. Check console for details.
	{:else if data.from === store.from}
		You sent {formatTokenAmount(BigInt(data.token.amount), data.token.decimals)}
		{data.token.symbol} to {data.to}
	{:else}
		You received {formatTokenAmount(BigInt(data.token.amount), data.token.decimals)}
		{data.token.symbol} from {data.from}
	{/if}
</ChatMessage>
