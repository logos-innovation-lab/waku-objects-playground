<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import CaretDown from '$lib/components/icons/caret-down.svelte'
	import WarningAltFilled from '$lib/components/icons/warning-alt-filled.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import ArrowDownRight from '$lib/components/icons/arrow-down-right.svelte'
	import ArrowUpRight from '$lib/components/icons/arrow-up-right.svelte'
	import Pending from '$lib/components/icons/pending.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input-field.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Grid from '$lib/components/grid.svelte'
	import ObjectDetailItem from '$lib/components/object-detail-item.svelte'
	import CheckmarkFilled from '$lib/components/icons/checkmark-filled.svelte'
	import Timestamp from '$lib/components/timestamp.svelte'

	import logo from './logo.svg'

	import { formatAddress, toSignificant, toBigInt, formatDateAndTime } from '$lib/utils/format'
	import type { WakuObjectArgs } from '..'
	import {
		SendTransactionStoreSchema,
		type SendTransactionStore,
		type SendTransactionDataMessage,
	} from './schemas'
	import type { Token } from '../schemas'
	import { throwError } from '$lib/utils/error'
	import Layout from '$lib/components/layout.svelte'

	export let args: WakuObjectArgs<SendTransactionStore, SendTransactionDataMessage>

	let store: SendTransactionStore | undefined
	$: {
		if (args.store) {
			const res = SendTransactionStoreSchema.safeParse(args.store)
			if (res.success) {
				store = res.data
			} else {
				console.error(res.error)
			}
		}
	}

	let transactionSent = false
	let token: Token
	let amount = ''
	let fee: Token | undefined = undefined

	$: if (!token) token = args.tokens[0]
	// FIXME: improve error handling, this will cause error 500
	let toUser =
		args.users.find((user) => user.address !== args.profile.address) || throwError('invalid user')
	$: if (amount && token) {
		try {
			const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }
			args.estimateTransaction(toUser.address, tokenToTransfer).then((f) => (fee = f))
		} catch (e) {
			console.log({ e })
		}
	}
	// $: if (!amount && store && store.view === 'overview') history.back()

	async function sendTransaction() {
		if (fee) {
			transactionSent = true

			// FIXME error handling
			const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }
			const transactionHash = await args.sendTransaction(toUser.address, tokenToTransfer, fee)

			await args.send({
				hash: transactionHash,
			})

			history.go(-3)
		}
	}
</script>

{#if store?.type === 'init'}
	<Layout>
		<svelte:fragment slot="header">
			<Header title="Payggy">
				<Button slot="left" variant="icon" on:click={() => history.back()}>
					<ChevronLeft />
				</Button>
				<Button slot="right" variant="icon" on:click={() => history.go(-3)}>
					<Close />
				</Button>
			</Header>
		</svelte:fragment>
		<Container gap={6} direction="column" justify="center" padX={12}>
			<ReadonlyText label="Amount">
				<div class="row">
					<div>
						<div class="text-lg">{amount} {token.symbol}</div>
						<div class="secondary text-sm">≈ 13.91 EUR now</div>
					</div>
					<Button variant="icon" align="right" on:click={() => history.back()}>
						<Edit />
					</Button>
				</div>
			</ReadonlyText>
			<ReadonlyText label="From">
				<div class="text-lg">Your account</div>
				<div class="secondary text-sm">{formatAddress(args.profile.address, 4, 4)}</div>
			</ReadonlyText>
			<ReadonlyText label="To">
				<div class="text-lg">{toUser.name}'s account</div>
				<div class="secondary text-sm">{formatAddress(toUser.address, 4, 4)}</div>
			</ReadonlyText>
			<ReadonlyText label="Transaction fee (max)">
				<div class="text-lg">
					{fee ? `${toSignificant(fee.amount, fee.decimals)} ${fee.symbol}` : 'unknown'}
				</div>
				<div class="secondary text-sm">≈ 1.56 EUR now</div>
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
				{toUser.name ?? formatAddress(toUser.address, 4, 4)}
			</div>
			<Button
				variant="strong"
				align="right"
				disabled={!amount || transactionSent}
				on:click={sendTransaction}
			>
				<ArrowUp /> Send now
			</Button>
		</Container>
	</Layout>
{:else if args.view === 'details'}
	<Layout>
		<svelte:fragment slot="header">
			<Header title={`Transaction #${args.instanceId}`}>
				<div slot="left">
					<img src={logo} alt="Payggy logo" class="logo" />
				</div>
				<Button slot="right" variant="icon" on:click={() => history.back()}>
					<Close />
				</Button>
			</Header>
		</svelte:fragment>
		{#if !store}
			<Container align="center" grow gap={6} justify="center" padX={24}>
				<h2>Loading details...</h2>
			</Container>
		{:else}
			{@const isSender = store.transaction.from === args.profile.address}
			<div class="details-wrapper">
				<div class="topper">
					<Container gap={6} direction="column" padX={12} align="center">
						<p class="title-amt">
							{#if isSender}
								<ArrowUpRight size={24} />
							{:else}
								<ArrowDownRight size={24} />
							{/if}
							{toSignificant(
								BigInt(store.transaction.token.amount),
								store.transaction.token.decimals,
							)}
							{store.transaction.token.symbol}
						</p>
						<p class="status">
							{#if store.type === 'success'}
								<CheckmarkFilled /> Transaction confirmed
							{:else if store.type === 'pending'}
								<Pending /> Transaction pending
							{:else}
								<WarningAltFilled /> Transaction failed
							{/if}
						</p>
					</Container>
				</div>
				<div class="details-section">
					<div class="detail-item">
						<ObjectDetailItem txHash={store.transaction.hash}>
							<svelte:fragment slot="top">
								<Timestamp>
									<!-- TODO: format the timestamp -->
									{formatDateAndTime(store.transaction.timestamp)}
								</Timestamp>
								<div class="text-lg">
									{#if isSender}
										You sent {toSignificant(
											BigInt(store.transaction.token.amount),
											store.transaction.token.decimals,
										)}
										{store.transaction.token.symbol} to {args.users.find(
											(u) => store && store.type !== 'init' && u.address === store.transaction.to,
										)?.name}
									{:else}
										You received {toSignificant(
											BigInt(store.transaction.token.amount),
											store.transaction.token.decimals,
										)}
										{store.transaction.token.symbol} from {args.users.find(
											(u) => store && store.type !== 'init' && u.address === store.transaction.from,
										)?.name}
									{/if}
								</div>
								<p class="status">
									{#if store.type === 'success'}
										<CheckmarkFilled /> Payment successful
									{:else if store.type === 'pending'}
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
										<div class="text-lg">{amount} {token.symbol}</div>
										<div class="secondary text-sm">≈ 13.91 EUR at the time of transaction</div>
									</div>
								</div>
							</ReadonlyText>
							<ReadonlyText label="Transaction fee (max)">
								<div class="text-lg">
									{fee ? `${toSignificant(fee.amount, fee.decimals)} ${fee.symbol}` : 'unknown'}
								</div>
								<div class="secondary text-sm">≈ 1.56 EUR now</div>
							</ReadonlyText>
							<ReadonlyText label="Transaction ID">
								<div class="text-lg">{store.transaction.hash}</div>
							</ReadonlyText>
							<ReadonlyText label="Transaction status">
								<div class="text-lg">{store.type}</div>
							</ReadonlyText>
						</ObjectDetailItem>
					</div>
				</div>
			</div>
		{/if}
	</Layout>
{:else}
	<Layout>
		<svelte:fragment slot="header">
			<Header title="Payggy">
				<Button slot="left" variant="icon" on:click={() => history.back()}>
					<ChevronLeft />
				</Button>
				<Button slot="right" variant="icon" on:click={() => history.go(-2)}>
					<Close />
				</Button>
			</Header>
		</svelte:fragment>
		<Container gap={24} justify="center" padX={24}>
			<p>How much would you like to send?</p>
			<div class="amt-drop">
				<Grid>
					<div>
						<Input autofocus bind:value={amount} placeholder="0" />
					</div>
					<div>
						<Dropdown>
							<Button grow align="block" slot="button">{token.symbol} <CaretDown /></Button>
							{#each args.tokens as t}
								<DropdownItem
									onClick={() => {
										token = t
									}}>{t.symbol}</DropdownItem
								>
							{/each}
						</Dropdown>
					</div>
				</Grid>
				<p class="fiat text-sm">x EUR {amount ? 'now' : ''}</p>
			</div>
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
			</p>
		</Container>
		<Container justify="flex-end">
			<Button
				variant="strong"
				disabled={!amount || Number(amount) > Number(toSignificant(token.amount, token.decimals))}
				on:click={() => {
					args.updateStore(() => ({ type: 'init' }))
					args.onViewChange && args.onViewChange('overview')
				}}
			>
				<ArrowRight />
			</Button>
		</Container>
	</Layout>
{/if}

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
	.logo {
		border-radius: var(--spacing-12);
	}
</style>
