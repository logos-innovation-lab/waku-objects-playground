<script lang="ts">
	import { ChevronLeft, WarningAltFilled, Edit, ArrowUp, Close } from 'carbon-icons-svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import Container from '$lib/components/container.svelte'

	import { formatAddress, toSignificant, toBigInt } from '$lib/utils/format'
	import type { SendTransactionDataMessage } from '../schemas'
	import type { TokenAmount } from '../../schemas'
	import type { User } from '$lib/types'
	import Layout from '$lib/components/layout.svelte'
	import { payggyDescriptor } from '..'
	import type { ExchangeRateRecord } from '$lib/stores/exchangeRates'
	import { getFiatAmountText } from '$lib/utils/fiat'
	import type { ErrorDescriptor } from '$lib/stores/error'
	import type { FiatSymbol } from '$lib/stores/preferences'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	export let toUser: User
	export let profile: User
	export let amount: string
	export let token: TokenAmount
	export let fiatRates: Map<string, ExchangeRateRecord>
	export let fiatSymbol: FiatSymbol

	export let estimateTransaction: (to: string, token: TokenAmount) => Promise<TokenAmount>
	export let sendTransaction: (to: string, token: TokenAmount, fee: TokenAmount) => Promise<string>
	export let send: (message: SendTransactionDataMessage) => Promise<void>
	export let exitObject: () => void
	export let addError: (error: ErrorDescriptor) => void

	let transactionSent = false
	let fee: TokenAmount | undefined = undefined

	async function tryEstimateTransaction() {
		try {
			const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }
			fee = await estimateTransaction(toUser.publicKey, tokenToTransfer)
		} catch (e) {
			addError({
				title: 'Payggy error',
				message: `Failed to estimate transaction fee. ${(e as Error).message}`,
				retry: tryEstimateTransaction,
				ok: true,
			})
		}
	}

	$: if (toUser && amount && token) tryEstimateTransaction()

	async function sendTransactionInternal() {
		if (!fee) {
			addError({
				title: 'Payggy error',
				message: 'No estimated transaction fee.',
				ok: true,
			})
			return
		}

		transactionSent = true
		const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }

		let transactionHash: string
		try {
			transactionHash = await sendTransaction(toUser.publicKey, tokenToTransfer, fee)

			await send({ hash: transactionHash })
			exitObject()
		} catch (error) {
			addError({
				title: 'Payggy Error',
				message: `Failed to send transaction. ${(error as Error).message}`,
				retry: sendTransactionInternal,
				ok: true,
			})
			return
		}
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title={payggyDescriptor.name}>
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={6} direction="column" justify="center" padX={12}>
		<ReadonlyText label="Amount">
			<div class="row">
				<div>
					<div class="text-lg">{amount} {token.symbol}</div>
					<div class="secondary text-sm">
						{getFiatAmountText(fiatRates, fiatSymbol, amount, token.symbol)}
					</div>
				</div>
				<Button variant="icon" align="right" on:click={() => history.back()}>
					<Edit />
				</Button>
			</div>
		</ReadonlyText>
		<ReadonlyText label="From">
			<div class="text-lg">Your account</div>
			<div class="secondary text-sm">
				{formatAddress(publicKeyToAddress(profile.publicKey), 4, 4)}
			</div>
		</ReadonlyText>
		<ReadonlyText label="To">
			<div class="text-lg">{toUser.name}'s account</div>
			<div class="secondary text-sm">
				{formatAddress(publicKeyToAddress(toUser.publicKey), 4, 4)}
			</div>
		</ReadonlyText>
		<ReadonlyText label="Transaction fee (max)">
			<div class="text-lg">
				{fee ? `${toSignificant(fee.amount, fee.decimals)} ${fee.symbol}` : 'unknown'}
			</div>
			<div class="secondary text-sm">
				{fee
					? getFiatAmountText(
							fiatRates,
							fiatSymbol,
							toSignificant(fee.amount, fee.decimals, fee.decimals),
							fee.symbol,
					  )
					: ''}
			</div>
		</ReadonlyText>
		<Container padY={0}>
			<p
				class={`balance ${
					Number(amount) > Number(toSignificant(token.amount, token.decimals)) ? 'text-bold' : ''
				}`}
			>
				{#if Number(amount) > Number(toSignificant(token.amount, token.decimals))}
					<WarningAltFilled />
				{/if}
				You have {toSignificant(token.amount, token.decimals)}
				{token.symbol} in your account.
			</p></Container
		>
	</Container>
	<Container direction="row" justify="space-between" alignItems="center" padX={24}>
		<div class="secondary text-normal">
			{toUser.name ?? formatAddress(publicKeyToAddress(toUser.publicKey), 4, 4)}
		</div>
		<Button
			variant="strong"
			align="right"
			disabled={!amount || transactionSent}
			on:click={sendTransactionInternal}
		>
			<ArrowUp /> Send now
		</Button>
	</Container>
</Layout>

<style lang="scss">
	.secondary {
		color: var(--color-step-40, var(--color-dark-step-20));
	}
	.row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	:global(.input-wrapper) {
		flex-grow: 1;
	}
	.amt-drop {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
	}
	.balance {
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
	}
	.title-amt {
		font-size: calc(var(--font-size-normal) * 1.3);
		font-weight: var(--font-weight-700);
	}
	.status {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
	}
</style>
