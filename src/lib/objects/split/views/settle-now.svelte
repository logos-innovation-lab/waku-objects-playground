<script lang="ts">
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'

	import type { User as UserType } from '$lib/types'
	import type { DataMessage } from '../schemas'
	import { splitDescriptor } from '..'
	import type { GetContract } from '../types'
	import { estimateSettleDebt, getOwedAmount, settleDebt } from '../blockchain'
	import type { TokenAmount, Token } from '$lib/objects/schemas'
	import { formatAddress, toSignificant } from '$lib/utils/format'
	import Info from '../components/info.svelte'

	export let profile: UserType
	export let instanceId: string
	export let chatName: string
	export let splitterAddress: string
	export let tokens: TokenAmount[]
	export let token: Token

	export let getContract: GetContract
	export let exitObject: () => void
	export let send: (message: DataMessage) => Promise<void>

	let owedAmount: undefined | bigint = undefined
	let settling = false
	let fee: bigint | undefined = undefined
	let feeError: undefined | Error = undefined
	let feeChecking = false

	$: getOwedAmount(getContract, splitterAddress, profile.address)
		.then((amount) => (owedAmount = amount))
		.catch(console.error)
	$: nativeToken = tokens.find((t) => !t.address)
	$: splitToken = tokens.find((t) => t.address === token.address)
	$: hasEnoughFunds = owedAmount && splitToken && owedAmount < splitToken?.amount

	$: if (hasEnoughFunds) {
		feeChecking = true
		estimateSettleDebt(getContract, splitterAddress, profile.address)
			.then((feeAmount) => {
				fee = feeAmount
			})
			.catch(console.error)
			.finally(() => (feeChecking = false))
	}

	async function settleNow() {
		if (!owedAmount) return
		try {
			settling = true
			const txHash = await settleDebt(getContract, splitterAddress, profile.address)
			send({
				type: 'payment',
				splitterAddress,
				tokenAddress: token.address,
				payment: {
					txHash,
					amount: owedAmount.toString(),
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
	{#if nativeToken === undefined || splitToken === undefined}
		<!-- This should never happen -->
		<p>No native token</p>
	{:else if owedAmount === undefined}
		<p>Loading...</p>
	{:else}
		<Container padX={24} padY={24} alignItems="center">
			<h1>{chatName} shared expenses</h1>
		</Container>
		<Divider />

		<Container gap={24} padX={24} padY={24} grow justify="center">
			<h2>Settle now</h2>

			{#if owedAmount > 0n}
				<Container gap={6} padX={0} padY={0}>
					<Info title="Amount to settle">
						{toSignificant(owedAmount, splitToken.decimals)}
						{nativeToken.symbol}
					</Info>
					<ReadonlyText marginBottom={0} align="center">
						<p class="text-sm">
							{toSignificant(nativeToken.amount, nativeToken.decimals)}
							{nativeToken.symbol} available
						</p>
					</ReadonlyText></Container
				>

				<Container gap={6} padX={0} padY={0}>
					<Info title="From">
						<p>Your account</p>
						<p class="text-sm">
							{formatAddress(profile.address, 6, 6)}
						</p>
					</Info>
				</Container>

				<Container gap={6} padX={0} padY={0}>
					{#if fee}
						<Info title="Transaction fee (max)">
							<p>{toSignificant(fee, nativeToken.decimals)} {nativeToken.symbol}</p>
							<p class="text-sm">
								{toSignificant(fee, nativeToken.decimals)} ≈ TODO DAI
							</p>
						</Info>
						<ReadonlyText marginBottom={0} align="center">
							<p class="text-sm">
								{toSignificant(splitToken.amount, splitToken.decimals)}
								{splitToken.symbol} available
							</p>
						</ReadonlyText>
					{:else if !hasEnoughFunds}
						<p>You don't have enough funds to settle</p>
					{:else if feeChecking}
						<Info title="Transaction fee (max)">
							<p>Loading...</p>
						</Info>
						<ReadonlyText marginBottom={0} align="center">
							<p class="text-sm">
								{toSignificant(splitToken.amount, splitToken.decimals)}
								{splitToken.symbol} available
							</p>
						</ReadonlyText>
					{:else}
						<p>Failed to check fee</p>
						<p>{feeError?.message}</p>
					{/if}
				</Container>
			{:else if owedAmount < 0n}
				<Container gap={12} padX={0} padY={0} align="center">
					<p>Nothing to settle, you are owed</p>
					<h1>{toSignificant(-owedAmount, splitToken.decimals)} {splitToken.symbol}</h1>
				</Container>
			{:else}
				<Container gap={12} padX={0} padY={0} align="center">
					<p>\(•◡•)/</p>
					<h1>Settled up</h1>
				</Container>
			{/if}
		</Container>

		<Container padX={24} padY={24} gap={6} justify="flex-end" alignItems="center">
			<Button
				variant="strong"
				on:click={settleNow}
				disabled={!hasEnoughFunds || settling || !fee || fee + owedAmount > splitToken.amount}
				><ArrowUp /> Pay now</Button
			>
		</Container>
	{/if}
</Layout>

<style>
	img {
		border-radius: var(--spacing-12);
	}
</style>
