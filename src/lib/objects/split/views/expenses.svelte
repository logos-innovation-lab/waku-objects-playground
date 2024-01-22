<script lang="ts">
	import { Close, ArrowRight, ChevronLeft, Receipt } from 'carbon-icons-svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'

	import type { User as UserType } from '$lib/types'
	import type { Expense } from '../schemas'
	import type { View } from '../types'
	import { toSignificant } from '$lib/utils/format'
	import type { Token } from '$lib/objects/schemas'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	export let users: UserType[]
	export let expenses: Expense[]
	export let profile: UserType
	export let token: Token

	export let exitObject: () => void
	export let onViewChange: (view: View, ...rest: string[]) => void
	export let goBack: () => void

	let totalExpenses = 0n
	$: {
		totalExpenses = 0n
		for (const { amount } of expenses) {
			totalExpenses += BigInt(amount)
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
				publicKeyToAddress(profile.publicKey) === expense.paidBy
					? 'You'
					: users.find((user) => publicKeyToAddress(user.publicKey) === expense.paidBy)?.name ??
					  'Unknown'}
			<div
				class="action"
				role="button"
				tabindex="0"
				on:click={() => onViewChange('expense', expense.txHash)}
				on:keypress={() => onViewChange('expense', expense.txHash)}
			>
				<Container padX={0} padY={6} gap={6}>
					<p>{toSignificant(expense.amount, token.decimals)} {token.symbol}</p>
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
			<h1>{toSignificant(totalExpenses, token.decimals)} {token.symbol}</h1>
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
