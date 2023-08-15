<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import WarningAltFilled from '$lib/components/icons/warning-alt-filled.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import Container from '$lib/components/container.svelte'

	import { formatAddress, toSignificant, toBigInt } from '$lib/utils/format'
	import type { SendTransactionDataMessage } from '../schemas'
	import type { Token } from '../../schemas'
	import type { User } from '$lib/types'
	import Layout from '$lib/components/layout.svelte'
	import { payggyDescriptor } from '..'

	export let toUser: User
	export let estimateTransaction: (to: string, token: Token) => Promise<Token>
	export let sendTransaction: (to: string, token: Token, fee: Token) => Promise<string>
	export let send: (message: SendTransactionDataMessage) => Promise<void>
	export let profile: User
	export let amount: string
	export let token: Token
	export let exitObject: () => void

	let transactionSent = false
	let fee: Token | undefined = undefined

	$: if (toUser && amount && token) {
		try {
			const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }
			estimateTransaction(toUser.address, tokenToTransfer).then((f) => (fee = f))
		} catch (e) {
			console.log({ e })
		}
	}

	async function sendTransactionInternal() {
		if (fee) {
			transactionSent = true

			// FIXME error handling
			const tokenToTransfer = { ...token, amount: toBigInt(amount, token.decimals) }
			const transactionHash = await sendTransaction(toUser.address, tokenToTransfer, fee)

			await send({ hash: transactionHash })

			exitObject()
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
					<div class="secondary text-sm">≈ 13.91 EUR now</div>
				</div>
				<Button variant="icon" align="right" on:click={() => history.back()}>
					<Edit />
				</Button>
			</div>
		</ReadonlyText>
		<ReadonlyText label="From">
			<div class="text-lg">Your account</div>
			<div class="secondary text-sm">{formatAddress(profile.address, 4, 4)}</div>
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
