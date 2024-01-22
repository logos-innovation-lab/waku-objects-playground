<script lang="ts">
	import { Close, Bullhorn, DataViewAlt, Renew } from 'carbon-icons-svelte'

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
	import type { Token } from '$lib/objects/schemas'
	import type { ErrorDescriptor } from '$lib/stores/error'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	export let expense: Expense
	export let users: User[]
	export let profile: User
	export let token: Token
	export let onViewChange: (view: View, ...rest: string[]) => void
	export let exitObject: () => void
	export let send: (message: DataMessage) => Promise<void>
	export let addError: (error: ErrorDescriptor) => void

	const bigIntPerUser = BigInt(expense.amount) / BigInt(users.length)
	const amountPerPerson = toSignificant(bigIntPerUser, token.decimals)
	const lentAmount = toSignificant(BigInt(expense.amount) - bigIntPerUser, token.decimals)
	const paidBy =
		publicKeyToAddress(profile.publicKey) === expense.paidBy
			? 'You'
			: users.find((user) => publicKeyToAddress(user.publicKey) === expense.paidBy)?.name ??
			  'Unknown'
	const paidByYou = expense.paidBy === publicKeyToAddress(profile.publicKey)

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
		<h1>{toSignificant(expense.amount, token.decimals)} {token.symbol}</h1>
		<p>{amountPerPerson} {token.symbol} per person</p>
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
			<h1>{lentAmount} {token.symbol}</h1>
			<Container direction="row" justify="center" alignItems="center">
				<Button variant="strong" on:click={askToSettle}><Bullhorn /> Ask to settle</Button>
				<Button on:click={viewAccounting}><DataViewAlt />View accounting</Button>
			</Container>
		{:else}
			<p>On this expense {paidBy} lend you</p>
			<h1>{amountPerPerson} {token.symbol}</h1>
			<Container direction="row" justify="center" alignItems="center">
				<Button variant="strong" on:click={settleNow}><Renew /> Settle now</Button>
				<Button on:click={viewAccounting}><DataViewAlt />View accounting</Button>
			</Container>
		{/if}
	</Container>
</Layout>
