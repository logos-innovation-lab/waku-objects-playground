<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Image from '$lib/components/image.svelte'
	import Grid from '$lib/components/grid.svelte'

	import type { DataMessage } from '../schemas'
	import { splitDescriptor } from '..'
	import type { User } from '$lib/types'
	import { toBigInt } from '$lib/utils/format'
	import { addExpense, createSplitterContract } from '../blockchain'
	import type { GetContract } from '../types'
	import type { Token } from '$lib/objects/schemas'

	export let amount: string
	export let description: string
	export let images: string[]
	export let chatName: string
	export let profile: User
	export let users: User[]
	export let splitterAddress: string | undefined
	export let instanceId: string
	export let token: Token
	export let send: (message: DataMessage) => Promise<void>
	export let exitObject: () => void
	export let getContract: GetContract

	let transactionSent = false

	async function sendTransactionInternal() {
		transactionSent = true
		try {
			const members = users.map((u) => u.address)

			let splitContractAddress = splitterAddress
			if (!splitContractAddress) {
				splitContractAddress = await createSplitterContract(getContract, members)
			}

			let amnt = toBigInt(amount, token.decimals)
			const txHash = await addExpense(
				getContract,
				splitContractAddress,
				amnt,
				profile.address,
				members,
			)

			await send({
				type: 'expense',
				splitterAddress: splitContractAddress,
				tokenAddress: token.address,
				expense: {
					amount: amnt.toString(),
					description,
					images,
					txHash,
					timestamp: Date.now(),
					paidBy: profile.address,
				},
				users: members,
			})

			exitObject()
		} catch (error) {
			console.log(error)
		}
		transactionSent = false
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title={splitDescriptor.name}>
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={6} direction="column" justify="center" padX={12}>
		<ReadonlyText label="Post to">
			<div class="text-lg">{chatName}</div>
		</ReadonlyText>
		<ReadonlyText label="Collection">
			<div class="text-lg">#{instanceId.slice(0, 4)}</div>
		</ReadonlyText>
		<ReadonlyText label="Paid amount">
			<div class="text-lg">{amount} {token.symbol}</div>
		</ReadonlyText>
		<ReadonlyText label="Description">
			<div class="text-lg">{description}</div>
		</ReadonlyText>
		{#if images.length > 0}
			<Grid>
				{#each images as image}
					<Image picture={image} />
				{/each}
			</Grid>
		{/if}
	</Container>
	<Container direction="row" justify="space-between" alignItems="center" padX={24}>
		<Button
			variant="strong"
			align="right"
			disabled={!amount || !description || transactionSent}
			on:click={sendTransactionInternal}
		>
			<ArrowUp /> Send now
		</Button>
	</Container>
</Layout>

<style lang="scss">
	:global(.input-wrapper) {
		flex-grow: 1;
	}
</style>
