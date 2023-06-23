<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import { formatAddress, formatTokenAmount } from '$lib/utils/format'
	import type { WakuObjectArgs } from '..'
	import { SendTransactionStandaloneSchema, type SendTransactionStandalone } from './schemas'
	import type { Token } from '../schemas'

	export let args: WakuObjectArgs

	let store: SendTransactionStandalone
	$: {
		const res = SendTransactionStandaloneSchema.safeParse(args.store)
		if (res.success) {
			store = res.data
		} else {
			console.error(res.error)
		}
	}

	let token: Token
	let amount = ''
	let fee: Token | undefined = undefined
	$: if (!token) token = store.nativeToken
	$: if (args.estimateTransaction && amount && token) {
		args.estimateTransaction(store.toUser.address, BigInt(amount), token).then((f) => (fee = f))
	}
	$: if (!amount && store.view === 'overview') history.back()

	function sendTransaction() {
		if (args.sendTransaction && fee) {
			// FIXME: check the amount is actually number and convert to some bigint mechanism which does not lose precision
			args.send({
				amount: (Number(amount) * 10 ** token.decimals).toString(),
				token: token.symbol,
				from: store.fromUser.address,
				to: store.toUser.address,
				fee: fee.amount.toString(),
				feeToken: fee.symbol,
			})

			args.sendTransaction(store.toUser.address, BigInt(amount), token, fee)
			history.go(-3)
		}
	}
</script>

{#if !store}
	<p>Invalid args</p>
{:else if store.view === 'overview'}
	<Header title="Send transaction">
		<Button slot="left" variant="icon" on:click={() => history.back()}>
			<ChevronLeft />
		</Button>
	</Header>

	<Container gap={6}>
		<div class="column">
			<div class="label">Amount</div>
			<div class="row grey">
				<div class="column">
					<div>{amount} {token.symbol}</div>
					<div>≈ 13.91 EUR now</div>
				</div>
				<div><Button on:click={() => history.back()}>edit</Button></div>
			</div>
		</div>
		<div class="column">
			<div class="label">From</div>
			<div class="column grey">
				<div>Your account</div>
				<div>{formatAddress(store.fromUser.address, 4, 4)}</div>
			</div>
		</div>
		<div class="column">
			<div class="label">To</div>
			<div class="column grey">
				<div>{store.toUser.name}</div>
				<div>{formatAddress(store.toUser.address, 4, 4)}</div>
			</div>
		</div>
		<div class="column">
			<div class="label">Transaction fee (max)</div>
			<div class="column grey">
				<div>
					{fee ? `${formatTokenAmount(fee.amount, fee.decimals)} ${fee.symbol}` : 'unknown'}
				</div>
				<div>≈ 1.56 EUR now</div>
			</div>
		</div>
		<p>
			You have {formatTokenAmount(store.nativeToken.amount, store.nativeToken.decimals)} ETH in your
			account.
		</p>
	</Container>
	<Container grow justify="flex-end">
		<div class="row">
			<div>{store.toUser.name ?? formatAddress(store.toUser.address, 4, 4)}</div>
			<div>
				<Button variant="strong" disabled={!amount} on:click={sendTransaction}>
					<ArrowRight /> Send now
				</Button>
			</div>
		</div>
	</Container>
{:else}
	<Header title="Send transaction">
		<Button slot="left" variant="icon" on:click={() => history.back()}>
			<ChevronLeft />
		</Button>
	</Header>

	<Container gap={6}>
		<p>How much would you like to send?</p>
		<Input bind:value={amount} />
		<Dropdown>
			<Button slot="button">{token.symbol}</Button>
			{#each store.tokens as t}
				<DropdownItem
					onClick={() => {
						token = t
					}}>{t.symbol}</DropdownItem
				>
			{/each}
		</Dropdown>
		<p>x EUR</p>
		<p>
			You have {formatTokenAmount(token.amount, token.decimals)}
			{token.symbol} in your account.
		</p>
	</Container>
	<Container grow justify="flex-end">
		<Button
			variant="strong"
			disabled={!amount}
			on:click={() => args.onViewChange && args.onViewChange('overview')}
		>
			<ArrowRight />
		</Button>
	</Container>
{/if}

<style>
	.column {
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.grey {
		background-color: #f3f3f3;
		padding: 12px;
		border-radius: 24px;
	}
	.label {
		font-size: 14px;
		color: #7c7c7c;
	}
</style>
