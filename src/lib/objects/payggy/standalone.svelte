<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import CaretDown from '$lib/components/icons/caret-down.svelte'
	import WarningAltFilled from '$lib/components/icons/warning-alt-filled.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input-field.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import { formatAddress, toSignificant, toBigInt } from '$lib/utils/format'
	import type { WakuObjectArgs } from '..'
	import {
		type MessageDataSend,
		SendTransactionStoreSchema,
		type SendTransactionStore,
	} from './schemas'
	import type { Token } from '../schemas'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import { throwError } from '$lib/utils/error'

	export let args: WakuObjectArgs<SendTransactionStore, MessageDataSend>

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

	let token: Token
	let amount = ''
	let fee: Token | undefined = undefined

	$: if (!token) {
		token =
			args.tokens.find((token) => token.symbol === defaultBlockchainNetwork.nativeToken) ||
			throwError('invalid token')
	}
	let toUser =
		args.users.find((user) => user.address !== args.profile.address) || throwError('invalid user')
	$: if (amount && token) {
		const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }
		args.estimateTransaction(toUser.address, tokenToTransfer).then((f) => (fee = f))
	}
	// $: if (!amount && store && store.view === 'overview') history.back()

	async function sendTransaction() {
		if (fee) {
			const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }

			const tx = await args.sendTransaction(toUser.address, tokenToTransfer, fee)
			// FIXME: check the amount is actually number and convert to some bigint mechanism which does not lose precision
			args.send({
				from: args.profile.address,
				to: toUser.address,
				token: {
					amount: tokenToTransfer.amount.toString(),
					symbol: tokenToTransfer.symbol,
					decimals: tokenToTransfer.decimals,
				},
				fee: {
					amount: fee.amount.toString(),
					symbol: fee.symbol,
					decimals: fee.decimals,
				},
				tx,
			})
			history.go(-3)
		}
	}
</script>

{#if store?.type === 'init'}
	<Header title="Payggy">
		<Button slot="left" variant="icon" on:click={() => history.back()}>
			<ChevronLeft />
		</Button>
		<Button slot="right" variant="icon" on:click={() => history.go(-3)}>
			<Close />
		</Button>
	</Header>

	<Container gap={6} direction="column" grow justify="center" padX={24}>
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
		<p
			class={`balance ${
				Number(amount) > Number(toSignificant(token.amount, token.decimals)) ? 'text-bold' : ''
			}`}
		>
			{#if Number(amount) > Number(toSignificant(token.amount, token.decimals))}
				<WarningAltFilled />
			{/if}
			You have {toSignificant(token.amount, token.decimals)} ETH in your account.
		</p>
	</Container>
	<Container direction="row" justify="space-between" alignItems="center" padX={24}>
		<div class="secondary text-normal">
			{toUser.name ?? formatAddress(toUser.address, 4, 4)}
		</div>
		<Button variant="strong" align="right" disabled={!amount} on:click={sendTransaction}>
			<ArrowUp /> Send now
		</Button>
	</Container>
{:else}
	<Header title="Payggy">
		<Button slot="left" variant="icon" on:click={() => history.back()}>
			<ChevronLeft />
		</Button>
		<Button slot="right" variant="icon" on:click={() => history.go(-2)}>
			<Close />
		</Button>
	</Header>

	<Container gap={24} grow justify="center" padX={24}>
		<p>How much would you like to send?</p>
		<div class="amt-drop">
			<div class="drop">
				<Input autofocus bind:value={amount} placeholder="0" />
				<Dropdown>
					<Button slot="button">{token.symbol} <CaretDown /></Button>
					{#each args.tokens as t}
						<DropdownItem
							onClick={() => {
								token = t
							}}>{t.symbol}</DropdownItem
						>
					{/each}
				</Dropdown>
			</div>
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
{/if}

<style lang="scss">
	.secondary {
		color: var(--gray40);
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

		.drop {
			display: flex;
			flex-direction: row;
			gap: var(--spacing-6);
			margin-inline: calc(var(--spacing-12) * -1);
		}
	}
	.balance {
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
	}
</style>
