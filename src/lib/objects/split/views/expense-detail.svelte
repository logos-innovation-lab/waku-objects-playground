<script lang="ts">
	import Close from '$lib/components/icons/close.svelte'
	import Bullhorn from '$lib/components/icons/bullhorn.svelte'
	import DataViewAlt from '$lib/components/icons/data-view-alt.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Image from '$lib/components/image.svelte'
	import Divider from '$lib/components/divider.svelte'

	import type { User } from '$lib/types'
	import type { View } from '../types'
	import type { DataMessage, Expense } from '../schemas'
	import { formatDateAndTime, toSignificant } from '$lib/utils/format'

	export let expense: Expense
	export let onViewChange: (view: View, ...rest: string[]) => void
	export let exitObject: () => void
	export let users: User[]
	export let profile: User
	export let send: (message: DataMessage) => Promise<void>

	const amountString = toSignificant(expense.amount, expense.decimals, expense.decimals)
	const amountPerPerson = (Number(amountString) / users.length).toFixed(2)
	const lentAmount = (Number(amountString) - Number(amountPerPerson)).toFixed(2)
	const paidBy =
		profile.address === expense.paidBy
			? 'You'
			: users.find((user) => user.address === expense.paidBy)?.name ?? 'Unknown'
	const paidByYou = expense.paidBy === profile.address

	async function askToSettle() {
		try {
			await send({
				type: 'settle-reminder',
			})

			exitObject()
		} catch (error) {
			console.log(error)
		}
	}

	function settleNow() {
		onViewChange('settle')
	}

	function viewAccounting() {
		onViewChange('accounting')
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title={expense.description}>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={6} padX={24} alignItems="center">
		<Container
			direction="row"
			justify="flex-start"
			alignItems="left"
			padX={0}
			padY={0}
			gap={12}
			wrap="wrap"
		>
			{#each expense.images as image}
				<Image picture={image} />
			{/each}
		</Container>
		<h1>{toSignificant(expense.amount, expense.decimals)} DAI</h1>
		<p>{amountPerPerson} DAI per person</p>
	</Container>
	<Divider pad={24} />
	<Container gap={0} padX={24} alignItems="center" grow>
		<p>
			Paid by
			{#if paidByYou}
				you
			{:else}
				{paidBy}
			{/if}
		</p>
		<p>{formatDateAndTime(expense.timestamp)}</p>
	</Container>
	<Divider />
	<Container padX={24} padY={24} gap={6} justify="flex-end" alignItems="center">
		{#if paidByYou}
			<p>On this expense you lent</p>
			<h1>{lentAmount} DAI</h1>
			<Container direction="row" justify="center" alignItems="center">
				<Button variant="strong" on:click={askToSettle}><Bullhorn /> Ask to settle</Button>
				<Button on:click={viewAccounting}><DataViewAlt />View accounting</Button>
			</Container>
		{:else}
			<p>On this expense {paidBy} lend you</p>
			<h1>{amountPerPerson} DAI</h1>
			<Container direction="row" justify="center" alignItems="center">
				<Button variant="strong" on:click={settleNow}><ArrowUp /> Settle now</Button>
				<Button on:click={viewAccounting}><DataViewAlt />View accounting</Button>
			</Container>
		{/if}
	</Container>
</Layout>
