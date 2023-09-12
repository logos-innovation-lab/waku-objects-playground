<script lang="ts">
	import type { Expense } from '../schemas'
	import Container from '$lib/components/container.svelte'
	import DataViewAlt from '$lib/components/icons/data-view-alt.svelte'
	import ObjectHeader from '$lib/components/object-header.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import { splitDescriptor } from '../'
	import Button from '$lib/components/button.svelte'
	import type { View } from '../types'
	import type { User } from '$lib/types'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import { toSignificant } from '$lib/utils/format'

	export let instanceId: string
	export let expense: Expense
	export let users: User[]
	export let sender: User | undefined
	export let myMessage: boolean
	export let isSender: boolean
	export let chatName: string

	export let onViewChange: (view: View, ...rest: string[]) => void

	const amountPerPerson = toSignificant(
		BigInt(expense.amount) / BigInt(users.length),
		expense.decimals,
	)
</script>

<ChatMessage {myMessage} object bubble>
	<div class="wo text-normal">
		<Container gap={12}>
			<ObjectHeader
				name={splitDescriptor.name}
				logoImg={splitDescriptor.logo}
				logoAlt={`${splitDescriptor.name} logo`}
			/>
			{#if isSender}
				You added a shared expense
			{:else}
				{sender?.name} added a shared expense
			{/if}
			<Container padY={0} padX={0}>
				<ReadonlyText
					clickable
					label={`${splitDescriptor.name} #${instanceId.slice(0, 4)}`}
					marginBottom={0}
				>
					<div
						class="readonly"
						on:click={() => onViewChange('collection')}
						on:keypress={() => onViewChange('collection')}
						role="button"
						tabindex={0}
					>
						<div class="grow">{chatName} shared expenses</div>
						<div class="change-view">
							<DataViewAlt />
						</div>
					</div>
					<div class="grow">{expense.description}</div>
					<div class="grow">{toSignificant(expense.amount, expense.decimals)} DAI</div>
				</ReadonlyText>
			</Container>
			<p class="text-sm">
				{amountPerPerson} DAI per person
			</p>
			<Button on:click={() => onViewChange('expense', expense.txHash)}>View expense</Button>
		</Container>
	</div>
</ChatMessage>

<style lang="scss">
	.wo {
		display: flex;
		flex-direction: column;
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

	.change-view {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
	}
</style>
