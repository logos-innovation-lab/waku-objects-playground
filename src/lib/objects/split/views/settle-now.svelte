<script lang="ts">
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'

	import type { User as UserType } from '$lib/types'
	import type { Balance, DataMessage } from '../schemas'
	import { splitDescriptor } from '..'
	import type { GetContract } from '../types'
	import { settleDebt } from '../blockchain'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import type { Token } from '$lib/objects/schemas'
	import { toSignificant } from '$lib/utils/format'

	export let profile: UserType
	export let balances: Balance[]
	export let instanceId: string
	export let chatName: string
	export let splitterAddress: string
	export let tokens: Token[]

	export let getContract: GetContract
	export let exitObject: () => void
	export let send: (message: DataMessage) => Promise<void>

	let owedAmount = BigInt(0)
	let decimals: number = defaultBlockchainNetwork.nativeToken.decimals
	let settling = false
	$: {
		const balance = balances.find(({ address }) => address === profile.address)
		if (balance) {
			owedAmount = BigInt(balance.amount)
			decimals = balance.decimals
		}
	}
	$: nativeToken = tokens.find((t) => !t.address)

	async function settleNow() {
		try {
			settling = true
			const txHash = await settleDebt(getContract, splitterAddress, profile.address)
			send({
				type: 'payment',
				splitterAddress,
				payment: {
					txHash,
					amount: owedAmount.toString(),
					decimals,
					paidBy: profile.address,
					timestamp: Date.now(),
				},
			})
			settling = false
			exitObject()
		} catch (error) {
			console.log(error)
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

	<Container gap={12} padX={24} padY={24} alignItems="center" grow>
		<h2>Settle now</h2>
		{#if nativeToken}
			<p>{toSignificant(owedAmount, decimals)} {nativeToken.symbol}</p>
			<p>
				Your amount {toSignificant(nativeToken.amount, nativeToken.decimals)}
				{nativeToken.symbol}
			</p>
		{/if}
	</Container>

	<Container padX={24} padY={24} gap={6} justify="flex-end" alignItems="center">
		<Button variant="strong" on:click={settleNow} disabled={settling}><ArrowUp /> Settle now</Button
		>
	</Container>
</Layout>

<style>
	img {
		border-radius: var(--spacing-12);
	}
</style>
