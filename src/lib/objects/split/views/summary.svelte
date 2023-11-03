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
	import { toBigInt, toSignificant } from '$lib/utils/format'
	import {
		addExpense,
		createSplitterContract,
		estimateAddExpense,
		estimateCreateSplitterContract,
	} from '../blockchain'
	import type { GetContract } from '../types'
	import type { Token, TokenAmount } from '$lib/objects/schemas'
	import Info from '../components/info.svelte'
	import type { ErrorDescriptor } from '$lib/stores/error'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	export let amount: string
	export let description: string
	export let images: string[]
	export let chatName: string
	export let profile: User
	export let users: string[]
	export let splitterAddress: string | undefined
	export let instanceId: string
	export let token: Token
	export let nativeToken: TokenAmount
	export let chainId: bigint
	export let send: (message: DataMessage) => Promise<void>
	export let exitObject: () => void
	export let getContract: GetContract
	export let addError: (error: ErrorDescriptor) => void

	let transactionSent = false
	let fee: bigint | undefined = undefined

	async function tryEstimateFee(users: string[], amount: string, token: Token) {
		let tmpFee = 0n
		let splitContractAddress = splitterAddress
		try {
			let amnt = toBigInt(amount, token.decimals)

			if (!splitContractAddress) {
				tmpFee = await estimateCreateSplitterContract(getContract, chainId, users)
			}
			tmpFee += await estimateAddExpense(
				getContract,
				chainId,
				splitContractAddress,
				amnt,
				publicKeyToAddress(profile.publicKey),
				users,
			)
		} catch (error) {
			addError({
				title: 'Splitter error',
				message: `Failed to estimate gas fee. ${(error as Error)?.message}`,
				ok: true,
				retry: () => tryEstimateFee(users, amount, token),
			})
		}
		fee = tmpFee
	}

	$: if (users && amount && token) tryEstimateFee(users, amount, token)

	async function sendTransactionInternal() {
		transactionSent = true
		try {
			let splitContractAddress = splitterAddress
			if (!splitContractAddress) {
				splitContractAddress = await createSplitterContract(getContract, chainId, users)
			}

			let amnt = toBigInt(amount, token.decimals)
			const txHash = await addExpense(
				getContract,
				splitContractAddress,
				amnt,
				publicKeyToAddress(profile.publicKey),
				users,
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
					paidBy: publicKeyToAddress(profile.publicKey),
				},
				users,
			})

			exitObject()
		} catch (error) {
			addError({
				title: 'Splitter error',
				message: `Failed to send transaction. ${(error as Error)?.message}`,
				ok: true,
				retry: sendTransactionInternal,
			})
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
	<Container gap={16} direction="column" justify="center" padX={12}>
		<Info title="Post to">
			<div class="text-lg">{chatName}</div>
		</Info>
		<Info title="Collection">
			<div class="text-lg">#{instanceId.slice(0, 4)}</div>
		</Info>
		<Info title="Paid amount">
			<div class="text-lg">{amount} {token.symbol}</div>
		</Info>
		<Info title="Description">
			<div class="text-lg">{description}</div>
		</Info>

		<Container gap={6} padX={0} padY={0}>
			<Info title="Transaction fee (max)">
				<div class="text-lg">
					{fee ? toSignificant(fee, nativeToken.decimals) : 'unknown'}
					{nativeToken.symbol}
				</div>
			</Info>
			<ReadonlyText marginBottom={0} align="center">
				<p class="text-sm">
					{toSignificant(nativeToken.amount, nativeToken.decimals)}
					{nativeToken.symbol} available
				</p>
			</ReadonlyText>
		</Container>

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
