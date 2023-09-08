<script lang="ts">
	import Close from '$lib/components/icons/close.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Receipt from '$lib/components/icons/receipt.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'

	import type { User as UserType } from '$lib/types'
	import type { Expense } from '../schemas'
	import type { View } from '../types'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import { toSignificant } from '$lib/utils/format'

	export let users: UserType[]
	export let expenses: Expense[]
	export let profile: UserType

	export let exitObject: () => void
	export let onViewChange: (view: View, ...rest: string[]) => void
	export let goBack: () => void

	let totalExpenses = 0n
	let decimals = defaultBlockchainNetwork.nativeToken.decimals
	$: {
		totalExpenses = 0n
		for (const { amount, decimals: d } of expenses) {
			totalExpenses += BigInt(amount)
			decimals = d
		}
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="All expenses">
			<Button slot="left" variant="icon" on:click={goBack}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>

	<Container padX={0} padY={0} grow>
		{#each expenses as expense}
			{@const paidBy =
				profile.address === expense.paidBy
					? 'You'
					: users.find((user) => user.address === expense.paidBy)?.name ?? 'Unknown'}
			<div
				class="action"
				role="button"
				tabindex="0"
				on:click={() => onViewChange('expense', expense.txHash)}
				on:keypress={() => onViewChange('expense', expense.txHash)}
			>
				<Container padX={0} padY={6} gap={6}>
					<p>{toSignificant(expense.amount, expense.decimals)} DAI</p>
					<p>{expense.description}</p>
					<p class="text-sm">Paid by {paidBy}</p>
				</Container>
				<ArrowRight size={24} />
			</div>
		{/each}
	</Container>

	<Divider />

	<Container alignItems="center" gap={24} padX={24} padY={24}>
		<Container alignItems="center" gap={6} padX={0} padY={0}>
			<p>Total expenses</p>
			<h1>{toSignificant(totalExpenses, decimals)} DAI</h1>
		</Container>
		<Button on:click={() => onViewChange('amount')} variant="strong">
			<Receipt />Add expense
		</Button>
	</Container>
</Layout>

<style>
	.action {
		display: flex;
		align-items: center;
		gap: var(--spacing-12);
		padding: var(--spacing-12) var(--spacing-24);
		border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));
		cursor: pointer;
	}
</style>