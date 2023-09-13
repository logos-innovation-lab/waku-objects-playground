<script lang="ts">
	import ChevronDown from '$lib/components/icons/chevron-down.svelte'
	import ChevronUp from '$lib/components/icons/chevron-up.svelte'

	import Container from '$lib/components/container.svelte'
	import Timestamp from '$lib/components/timestamp.svelte'
	import Image from '$lib/components/image.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'

	import { formatDateAndTime, toSignificant } from '$lib/utils/format'
	import type { Activity } from '../types'
	import type { User } from '$lib/types'
	import type { TokenNoAmount } from '$lib/objects/schemas'

	export let activity: Activity
	export let users: User[]
	export let profile: User
	export let token: TokenNoAmount

	let expanded = false

	$: paidBy =
		profile.address === activity.paidBy
			? 'You'
			: users.find((user) => user.address === activity.paidBy)?.name ?? 'Unknown'
</script>

<div class="activity">
	<Container padY={12} padX={12} gap={12}>
		<Timestamp>{formatDateAndTime(activity.timestamp)}</Timestamp>
		<p>
			{paidBy}
			{#if activity.type === 'expense'}added a shared expense
			{:else}settled up
			{/if}
		</p>
	</Container>
	<div class="divider" />
	<Container padY={24} padX={12} gap={12}>
		<div
			class="action"
			role="button"
			tabindex="0"
			on:click={() => (expanded = !expanded)}
			on:keypress={() => (expanded = !expanded)}
		>
			<Container padY={0} gap={6} padX={12} justify="space-between" direction="row">
				<p>Details</p>
				{#if expanded}
					<ChevronUp />
				{:else}
					<ChevronDown />
				{/if}
			</Container>
		</div>
		{#if expanded}
			<Container padY={0} gap={6} padX={12}>
				{#if activity.type === 'expense'}
					<ReadonlyText label="Paid amount"
						>{toSignificant(activity.amount, token.decimals)} {token.symbol}</ReadonlyText
					>
					<ReadonlyText label="Description">{activity.description}</ReadonlyText>
					{#if activity.images.length > 0}
						<p class="text-sm">Images</p>
						<Container
							direction="row"
							justify="flex-start"
							alignItems="left"
							padX={0}
							padY={0}
							gap={12}
							wrap="wrap"
						>
							{#each activity.images as image}
								<Image picture={image} />
							{/each}
						</Container>
					{/if}
				{:else}
					<ReadonlyText label="Paid amount"
						>{toSignificant(activity.amount, token.decimals)} {token.symbol}</ReadonlyText
					>
				{/if}
			</Container>
		{/if}
	</Container>
</div>

<style>
	.action {
		cursor: pointer;
	}
	.activity {
		background-color: var(--color-base, var(--color-dark-base));
		border-radius: var(--spacing-24);
	}

	.divider {
		height: 1px;
		background-color: var(--color-step-10, var(--color-dark-step-50));
		flex-shrink: 0;
	}
</style>
