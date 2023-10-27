<script lang="ts">
	import Bullhorn from '$lib/components/icons/bullhorn.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import ArrowsVertical from '$lib/components/icons/arrows-vertical.svelte'
	import Receipt from '$lib/components/icons/receipt.svelte'
	import ShowDataCards from '$lib/components/icons/show-data-cards.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'

	import type { User as UserType } from '$lib/types'
	import type { Balance, DataMessage, Payment, Expense } from '../schemas'
	import { splitDescriptor } from '..'
	import type { View, Activity as ActivityType } from '../types'
	import Activity from '../components/activity.svelte'
	import { toSignificant } from '$lib/utils/format'
	import type { Token } from '$lib/objects/schemas'
	import type { ErrorDescriptor } from '$lib/stores/error'

	export let profile: UserType
	export let balances: Balance[]
	export let payments: Payment[]
	export let expenses: Expense[]
	export let instanceId: string
	export let chatName: string
	export let users: UserType[]
	export let token: Token

	export let exitObject: () => void
	export let send: (message: DataMessage) => Promise<void>
	export let onViewChange: (view: View, ...rest: string[]) => void
	export let addError: (error: ErrorDescriptor) => void

	let owedAmount = 0n
	$: {
		const balance = balances.find(({ address }) => address === profile.address)
		if (balance) {
			// FIXME: we should handle non-number strings parse error
			owedAmount = BigInt(balance.amount)
		}
	}

	let latestActivity: ActivityType[] = []
	$: latestActivity = [
		...payments.map((p) => ({ ...p, type: 'payment' } as ActivityType)),
		...expenses.map((e) => ({ ...e, type: 'expense' } as ActivityType)),
	].sort((a, b) => b.timestamp - a.timestamp)

	function settleNow() {
		onViewChange('settle')
	}

	async function askToSettle() {
		try {
			await send({
				type: 'settle-reminder',
			})

			exitObject()
		} catch (error) {
			addError({
				title: 'Splitter error',
				message: `Failed to send settle reminder. ${(error as Error).message}`,
				ok: true,
			})
		}
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title={`${splitDescriptor.name} #${instanceId.slice(0, 4)}`}>
			<img slot="left" src={splitDescriptor.logo} alt={`${splitDescriptor.name} logo`} />
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container padX={24} padY={24} alignItems="center">
		<h1>{chatName} shared expenses</h1>
	</Container>
	<Divider />
	{#if latestActivity.length > 0}
		<div class="preview">
			<Container padY={24} gap={12} padX={12}>
				{@const activity = latestActivity[0]}
				<Container padY={0} gap={6} padX={12} justify="space-between" direction="row">
					<h3>Latest activity</h3>
					<button on:click={() => onViewChange('activity')}>View all</button>
				</Container>
				<Activity {activity} {users} {profile} {token} />
			</Container>
		</div>
	{/if}
	<Container gap={12} padX={24} padY={24} alignItems="center">
		{#if owedAmount < 0}
			<p>Overall you lent</p>
			<h1>{toSignificant(-owedAmount, token.decimals)} {token.symbol}</h1>
			<Button variant="strong" on:click={askToSettle}><Bullhorn /> Ask to settle</Button>
		{:else if owedAmount > 0}
			<p>Overall you owe</p>
			<h1>{toSignificant(owedAmount, token.decimals)} {token.symbol}</h1>
			<Button variant="strong" on:click={settleNow}><Renew /> Settle now</Button>
		{:else}
			<p>\(•◡•)/</p>
			<h1>Settled up</h1>
		{/if}
		<Button on:click={() => onViewChange('amount')} variant={owedAmount === 0n ? 'strong' : ''}>
			<Receipt />Add expense
		</Button>
	</Container>

	<Container direction="column" padX={0} padY={0}>
		<div
			class="action"
			role="button"
			tabindex="0"
			on:click={() => onViewChange('accounting')}
			on:keypress={() => onViewChange('accounting')}
		>
			<Container direction="row" padX={0} padY={6} gap={6}>
				<ArrowsVertical />
				<p>Payment summary</p>
			</Container>
			<ArrowRight size={24} />
		</div>
		<div
			class="action"
			role="button"
			tabindex="0"
			on:click={() => onViewChange('expenses')}
			on:keypress={() => onViewChange('expenses')}
		>
			<Container direction="row" padX={0} padY={6} gap={6}>
				<Receipt />
				<p>All expenses</p>
			</Container>
			<ArrowRight size={24} />
		</div>
		<div
			class="action"
			role="button"
			tabindex="0"
			on:click={() => onViewChange('activity')}
			on:keypress={() => onViewChange('activity')}
		>
			<Container direction="row" padX={0} padY={6} gap={6}>
				<ShowDataCards />
				<div>Activity history</div>
			</Container>
			<ArrowRight size={24} />
		</div>
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

	.action:first-child {
		border-top: 1px solid var(--color-step-20, var(--color-dark-step-40));
	}

	.preview {
		background-color: var(--color-step-10, var(--color-dark-step-50));
		border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));
	}

	button {
		opacity: 1;
		color: var(--color-step-40, var(--color-dark-step-20));
		font-size: 16px;
		font-weight: 400;
		font-style: normal;
		letter-spacing: 0px;
		text-align: left;
		line-height: 20px;
		border: none;
		border-bottom: 1px solid var(--color-step-40, var(--color-dark-step-20));
		background-color: var(--color-step-10, var(--color-dark-step-50));
	}

	img {
		border-radius: var(--spacing-12);
	}
</style>
