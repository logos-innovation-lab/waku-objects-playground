<script lang="ts">
	import WarningAltFilled from '$lib/components/icons/warning-alt-filled.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import ArrowDownRight from '$lib/components/icons/arrow-down-right.svelte'
	import ArrowUpRight from '$lib/components/icons/arrow-up-right.svelte'
	import Pending from '$lib/components/icons/pending.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import Container from '$lib/components/container.svelte'
	import ObjectDetailItem from '$lib/components/object-detail-item.svelte'
	import CheckmarkFilled from '$lib/components/icons/checkmark-filled.svelte'
	import Timestamp from '$lib/components/timestamp.svelte'

	import { toSignificant, formatDateAndTime } from '$lib/utils/format'
	import type { Transaction } from '../../schemas'
	import type { User } from '$lib/types'
	import Layout from '$lib/components/layout.svelte'
	import { payggyDescriptor } from '..'
	import { getFiatAmountText } from '$lib/objects/utils'
	import type { ExchangeRateRecord } from '$lib/stores/exchangeRates'

	export let transaction: Transaction
	export let users: User[]
	export let instanceId: string
	export let profile: User
	export let status: string
	export let fiatRates: Map<string, ExchangeRateRecord>
	export let fiatSymbol: string | undefined
	export let exitObject: () => void

	$: sender = users.find((u) => u.address === transaction.from)
	$: recipient = users.find((u) => u.address === transaction.to)

	$: isSender = profile.address === sender?.address
	$: isRecipient = profile.address === recipient?.address
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title={`Transaction #${instanceId}`}>
			<div slot="left">
				<img src={payggyDescriptor.logo} alt="Payggy logo" class="logo" />
			</div>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<div class="details-wrapper">
		<div class="topper">
			<Container gap={6} direction="column" padX={12} align="center">
				<p class="title-amt">
					{#if isRecipient}
						<ArrowDownRight size={24} />
					{:else}
						<ArrowUpRight size={24} />
					{/if}
					{toSignificant(BigInt(transaction.token.amount), transaction.token.decimals)}
					{transaction.token.symbol}
				</p>
				<p class="status">
					{#if status === 'success'}
						<CheckmarkFilled /> Transaction confirmed
					{:else if status === 'pending'}
						<Pending /> Transaction pending
					{:else}
						<WarningAltFilled /> Transaction failed
					{/if}
				</p>
			</Container>
		</div>
		<div class="details-section">
			<div class="detail-item">
				<ObjectDetailItem txHash={transaction.hash}>
					<svelte:fragment slot="top">
						<Timestamp>
							<!-- TODO: format the timestamp -->
							{formatDateAndTime(transaction.timestamp)}
						</Timestamp>
						<div class="text-lg">
							{#if isSender}
								You sent {toSignificant(
									BigInt(transaction.token.amount),
									transaction.token.decimals,
								)}
								{transaction.token.symbol} to {recipient?.name}
							{:else if isRecipient}
								You received {toSignificant(
									BigInt(transaction.token.amount),
									transaction.token.decimals,
								)}
								{transaction.token.symbol} from {sender?.name}
							{:else}
								{sender?.name} sent {toSignificant(
									BigInt(transaction.token.amount),
									transaction.token.decimals,
								)}
								{transaction.token.symbol} to {recipient?.name}
							{/if}
						</div>
						<p class="status">
							{#if status === 'success'}
								<CheckmarkFilled /> Payment successful
							{:else if status === 'pending'}
								<Pending /> Payment pending
							{:else}
								<WarningAltFilled /> Payment failed
							{/if}
						</p>
					</svelte:fragment>
					<!-- Details -->
					<ReadonlyText label="Amount">
						<div class="row">
							<div>
								<div class="text-lg">
									{toSignificant(transaction.token.amount, transaction.token.decimals)}
									{transaction.token.symbol}
								</div>
								<div class="secondary text-sm">≈ 13.91 EUR at the time of transaction</div>
							</div>
						</div>
					</ReadonlyText>
					<ReadonlyText label="Transaction fee">
						<div class="text-lg">
							{transaction.fee
								? `${toSignificant(transaction.fee.amount, transaction.fee.decimals)} ${
										transaction.fee.symbol
								  }`
								: 'unknown'}
						</div>
						<div class="secondary text-sm">
							{getFiatAmountText(
								fiatRates,
								fiatSymbol,
								toSignificant(transaction.fee.amount, transaction.fee.decimals),
								transaction.fee.symbol,
							)}
						</div>
					</ReadonlyText>
					<ReadonlyText label="Transaction ID">
						<div class="text-lg">{transaction.hash}</div>
					</ReadonlyText>
					<ReadonlyText label="Transaction status">
						<div class="text-lg">{status}</div>
					</ReadonlyText>
				</ObjectDetailItem>
			</div>
		</div>
	</div>
</Layout>

<style lang="scss">
	.details-wrapper {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		.topper {
			background-color: var(--color-base, var(--color-dark-accent));
			padding-top: 18px;
			padding-bottom: var(--spacing-24);
			flex-grow: 0;
		}
		.details-section {
			background-color: var(--color-step-10, var(--color-dark-step-50));

			flex-grow: 1;
		}
		.detail-item {
			background-color: transparent;
		}
	}
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
