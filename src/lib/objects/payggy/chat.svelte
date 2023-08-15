<script lang="ts">
	import {
		type SendTransactionDataMessage,
		type SendTransactionStore,
		SendTransactionStoreSchema,
	} from './schemas'
	import type { WakuObjectArgs } from '..'
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
	import Spacer from '$lib/components/spacer.svelte'
	import { payggyDescriptor } from '.'

	export let message: DataMessage<SendTransactionDataMessage>
	export let args: WakuObjectArgs<SendTransactionStore, SendTransactionDataMessage>

	let data: SendTransactionStore | undefined
	$: {
		if (args.store) {
			const res = SendTransactionStoreSchema.safeParse(args.store)
			if (res.success) {
				data = res.data
			} else {
				console.error(res.error)
			}
		}
	}

	function onDetailsClick() {
		if (args.onViewChange) args.onViewChange('details')
	}

	$: sender = args.users.find((u) => u.address === data?.transaction.from)
	$: recipient = args.users.find((u) => u.address === data?.transaction.to)

	$: myMessage = args.profile.address === message.fromAddress
	$: isSender = args.profile.address === sender?.address
	$: isRecipient = args.profile.address === recipient?.address
</script>

<ChatMessage {myMessage} object bubble>
	<div class="wo text-normal">
		<Container gap={12}>
			<ObjectHeader
				name={payggyDescriptor.name}
				logoImg={payggyDescriptor.logo}
				logoAlt={`${payggyDescriptor.name} logo`}
			/>
			{#if !args.store || !message.data || !sender || !recipient}
				Loading...
			{:else if !data}
				<!-- This is an error state -->
				Failed to parse store or message data. Check console for details.
			{:else if data.type === 'error'}
				Transaction failed
			{:else if isSender}
				You sent {toSignificant(
					BigInt(data.transaction.token.amount),
					data.transaction.token.decimals,
				)}
				{data.transaction.token.symbol} to {recipient.name}
			{:else if isRecipient}
				You received {toSignificant(
					BigInt(data.transaction.token.amount),
					data.transaction.token.decimals,
				)}
				{data.transaction.token.symbol} from {sender.name}
			{:else}
				{sender?.name} sent {toSignificant(
					BigInt(data.transaction.token.amount),
					data.transaction.token.decimals,
				)}
				{data.transaction.token.symbol} to {recipient?.name}
			{/if}
		</Container>
		{#if args.store && message.data && data}
			<Container padY={0} padX={0}>
				<ReadonlyText
					clickable
					label={`${message.objectId} #${message.instanceId.slice(0, 4)}`}
					marginBottom={0}
				>
					<div
						class="readonly"
						on:click={onDetailsClick}
						on:keypress={onDetailsClick}
						role="button"
						tabindex={0}
					>
						{#if isRecipient}
							<ArrowDownRight />
						{:else}
							<ArrowUpRight />
						{/if}
						{#if data.type === 'pending' || data.type === 'success'}
							<div class="grow text-lg">
								{toSignificant(
									BigInt(data.transaction.token.amount),
									data.transaction.token.decimals,
								)}
								{data.transaction.token.symbol}
							</div>
						{/if}
						<div class="change-view">
							<DataViewAlt />
						</div>
					</div>
				</ReadonlyText>
			</Container>
			<Spacer height={12} />
			<Container padY={0}>
				<!-- TODO: add check for transaction status -->
				<p class="transaction-status">
					{#if data.type === 'success'}
						<CheckmarkFilled />Payment successful
					{:else if data.type === 'pending'}
						Payment pending...
					{/if}
				</p>
			</Container>
		{/if}
	</div>
</ChatMessage>

<style lang="scss">
	.wo {
		display: flex;
		flex-direction: column;
		// gap: var(--spacing-12);
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

	.change-view {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
	}
</style>
