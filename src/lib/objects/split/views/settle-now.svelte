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
	import type { Balance, DataMessage } from '../schemas'
	import { splitDescriptor } from '..'
	import type { GetContract } from '../types'
	import { settleDebt } from '../blockchain'
	import type { Token, TokenNoAmount } from '$lib/objects/schemas'
	import { formatAddress, toSignificant } from '$lib/utils/format'

	export let profile: UserType
	export let balances: Balance[]
	export let instanceId: string
	export let chatName: string
	export let splitterAddress: string
	export let tokens: Token[]
	export let token: TokenNoAmount

	export let getContract: GetContract
	export let exitObject: () => void
	export let send: (message: DataMessage) => Promise<void>

	let owedAmount = 0n
	let settling = false
	$: {
		const balance = balances.find(({ address }) => address === profile.address)
		if (balance) {
			owedAmount = BigInt(balance.amount)
		}
	}
	$: nativeToken = tokens.find((t) => !t.address)
	$: splitToken = tokens.find((t) => t.address === token.address)

	async function settleNow() {
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

	$: fee = nativeToken ? { ...nativeToken, amount: 1000000000000000n } : undefined
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
	{#if nativeToken === undefined || splitToken === undefined || fee === undefined}
		<!-- This should never happen -->
		<p>No native token</p>
	{:else}
		<Container padX={24} padY={24} alignItems="center">
			<h1>{chatName} shared expenses</h1>
		</Container>
		<Divider />

		<Container gap={24} padX={24} padY={24} grow justify="center">
			<h2>Settle now</h2>

			{#if owedAmount > 0n}
				<Container gap={6} padX={0} padY={0}>
					<div class="label">
						<span class="text-sm">Amount to settle</span>
						<div class="input-wrapper">
							<!-- svelte-ignore a11y-autofocus -->
							<div class="text-lg input">
								{toSignificant(owedAmount, splitToken.decimals)}
								{nativeToken.symbol}
							</div>
						</div>
					</div>
					<ReadonlyText marginBottom={0} align="center">
						<p class="text-sm">
							{toSignificant(nativeToken.amount, nativeToken.decimals)}
							{nativeToken.symbol} available
						</p>
					</ReadonlyText></Container
				>

				<Container gap={6} padX={0} padY={0}>
					<div class="label">
						<span class="text-sm">From</span>
						<div class="input-wrapper">
							<!-- svelte-ignore a11y-autofocus -->
							<div class="text-lg input">
								<p>Your account</p>
								<p class="text-sm">
									{formatAddress(profile.address, 6, 6)}
								</p>
							</div>
						</div>
					</div>
				</Container>

				<Container gap={6} padX={0} padY={0}>
					<div class="label">
						<span class="text-sm">Transaction fee (max)</span>
						<div class="input-wrapper">
							<!-- svelte-ignore a11y-autofocus -->
							<div class="text-lg input">
								<p>{toSignificant(fee.amount, fee.decimals)} {fee.symbol}</p>
								<p class="text-sm">
									{toSignificant(fee.amount, fee.decimals)} ≈ {toSignificant(
										fee.amount,
										fee.decimals,
									)}
									DAI
								</p>
							</div>
						</div>
					</div>
					<ReadonlyText marginBottom={0} align="center">
						<p class="text-sm">
							{toSignificant(splitToken.amount, splitToken.decimals)}
							{splitToken.symbol} available
						</p>
					</ReadonlyText>
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
				disabled={settling || fee.amount + owedAmount > nativeToken.amount}
				><ArrowUp /> Pay now</Button
			>
		</Container>
	{/if}
</Layout>

<style>
	img {
		border-radius: var(--spacing-12);
	}

	.label {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.label span {
		margin-inline: 13px;
		text-align: left;
		color: var(--color-step-40, var(--color-dark-step-20));
	}

	.input-wrapper {
		position: relative;
	}

	.input {
		border: 1px solid var(--color-step-20, var(--color-dark-step-40));
		border-radius: var(--border-radius);
		padding: 11px var(--spacing-12);
		max-height: 120px;
		min-height: 48px;
		width: 100%;
		color: var(--color-step-40, var(--color-dark-step-20));
		background-color: var(--color-base, var(--color-dark-accent));
	}
</style>
