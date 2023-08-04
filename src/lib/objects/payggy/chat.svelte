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
	import logo from './logo.svg'

	export let message: DataMessage<SendTransactionDataMessage>
	export let args: WakuObjectArgs<SendTransactionStore, SendTransactionDataMessage>

	let data: SendTransactionStore
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

	$: myMessage = message.fromAddress === args.profile.address
	// FIXME: will not work for group chats
	$: otherUser = args.users.find((u) => u.address !== args.profile.address)
	function onDetailsClick() {
		if (args.onViewChange) args.onViewChange('details')
	}
</script>

<ChatMessage {myMessage} object bubble>
	<Container>
		<div class="wo text-normal">
			<ObjectHeader name="Payggy" logoImg={logo} logoAlt="Payggy logo" />
			{#if !args.store || !message.data || !otherUser}
				Loading...
			{:else if !data}
				<!-- This is an error state -->
				Failed to parse store or message data. Check console for details.
			{:else if myMessage && (data.type === 'pending' || data.type === 'success')}
				You sent {toSignificant(
					BigInt(data.transaction.token.amount),
					data.transaction.token.decimals,
				)}
				{data.transaction.token.symbol} to {otherUser.name}
			{:else if data.type === 'pending' || data.type === 'success'}
				You received {toSignificant(
					BigInt(data.transaction.token.amount),
					data.transaction.token.decimals,
				)}
				{data.transaction.token.symbol} from {otherUser.name}
			{/if}
			{#if args.store && message.data && data}
				<ReadonlyText
					label={`${message.objectId} #${message.instanceId.slice(0, 4)}`}
					marginBottom={0}
				>
					<div class="readonly">
						{#if myMessage}
							<ArrowUpRight />
						{:else}
							<ArrowDownRight />
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
						<div
							class="change-view"
							on:click={onDetailsClick}
							on:keypress={onDetailsClick}
							role="button"
							tabindex={0}
						>
							<DataViewAlt />
						</div>
					</div>
				</ReadonlyText>
				<!-- TODO: add check for transaction status -->
				<p class="transaction-status">
					{#if data.type === 'success'}
						<CheckmarkFilled />Payment successful
					{:else if data.type === 'pending'}
						Payment pending...
					{/if}
				</p>
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

	.change-view {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
	}
</style>
