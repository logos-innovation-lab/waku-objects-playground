<script lang="ts">
	import { ChevronLeft, ArrowRight, CaretDown, WarningAltFilled, Close } from 'carbon-icons-svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input-field.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Grid from '$lib/components/grid.svelte'

	import { toSignificant } from '$lib/utils/format'
	import type { TokenAmount } from '../../schemas'
	import Layout from '$lib/components/layout.svelte'
	import { payggyDescriptor } from '..'
	import type { ExchangeRateRecord } from '$lib/stores/exchangeRates'
	import { getFiatAmountText } from '$lib/utils/fiat'
	import type { FiatSymbol } from '$lib/stores/preferences'

	export let amount: string
	export let token: TokenAmount
	export let tokens: TokenAmount[]
	export let fiatRates: Map<string, ExchangeRateRecord>
	export let fiatSymbol: FiatSymbol
	export let onViewChange: (view: string) => void
	export let exitObject: () => void

	$: if (!token) token = tokens.find((t) => t.address === undefined) ?? tokens[0]
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
						{#each tokens as t}
							<DropdownItem
								onClick={() => {
									token = t
								}}>{t.symbol}</DropdownItem
							>
						{/each}
					</Dropdown>
				</div>
			</Grid>
			<p class="fiat text-sm">
				{getFiatAmountText(fiatRates, fiatSymbol, amount, token.symbol)}
			</p>
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
			on:click={() => onViewChange('overview')}
		>
			<ArrowRight />
		</Button>
	</Container>
</Layout>
