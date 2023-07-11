<script lang="ts">
	import { SendTransactionSchema, type MessageDataSend, MessageDataSendSchema } from './schemas'
	import type { WakuObjectArgs } from '..'
	import type { SendTransaction } from './schemas'
	import type { DataMessage } from '$lib/stores/chat'
	import { toSignificant } from '$lib/utils/format'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import ObjectHeader from '$lib/components/object-header.svelte'
	import ArrowDownRight from '$lib/components/icons/arrow-down-right.svelte'
	import ArrowUpRight from '$lib/components/icons/arrow-up-right.svelte'
	import DataViewAlt from '$lib/components/icons/data-view-alt.svelte'
	import CheckmarkFilled from '$lib/components/icons/checkmark-filled.svelte'
	import Container from '$lib/components/container.svelte'
	import logo from './logo.svg'

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
	$: myMessage = data?.from === args.profile.address
	// FIXME: will not work for group chats
	$: otherUser = args.users.find((u) => u.address !== args.profile.address)
</script>

<ChatMessage {myMessage} bubble>
	<Container>
		<div class="wo text-normal">
			<ObjectHeader name="Payggy" logoImg={logo} logoAlt="Payggy logo" />
			{#if !args.store || !message.data || !otherUser}
				Loading...
			{:else if !store || !data}
				<!-- This is an error state -->
				Failed to parse store or message data. Check console for details.
			{:else if myMessage}
				You sent {toSignificant(BigInt(data.token.amount), data.token.decimals)}
				{data.token.symbol} to {otherUser.name}
			{:else}
				You received {toSignificant(BigInt(data.token.amount), data.token.decimals)}
				{data.token.symbol} from {otherUser.name}
			{/if}
			{#if args.store && message.data && store && data}
				<!-- TODO: figure out what the transaction # is supposed to be -->
				<ReadonlyText label={`Transaction #${data.tx}`} marginBottom={0}>
					<div class="readonly">
						{#if myMessage}
							<ArrowUpRight />
						{:else}
							<ArrowDownRight />
						{/if}
						<div class="grow text-lg">
							{toSignificant(BigInt(data.token.amount), data.token.decimals)}
							{data.token.symbol}
						</div>
						<!-- TODO: add action to icon -->
						<DataViewAlt />
					</div>
				</ReadonlyText>
				<!-- TODO: add check for transaction status -->
				<p class="transaction-status"><CheckmarkFilled />Payment successful</p>
			{/if}
		</div>
	</Container>
</ChatMessage>

<style lang="scss">
	.wo {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
		font-family: var(--font-body);
		font-style: normal;
		text-align: left;
	}

	.readonly {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);

		.grow {
			flex-grow: 1;
			font-weight: 500;
		}
	}

	.transaction-status {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);
	}
</style>
