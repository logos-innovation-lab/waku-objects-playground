<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import Add from '$lib/components/icons/add.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'
	import Sort from '$lib/components/icons/caret-sort.svelte'
	import Container from '$lib/components/container.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Card from '$lib/components/card.svelte'

	import { goto } from '$app/navigation'
	import ROUTES from '$lib/routes'

	const wallets = [
		{
			title: 'Main Wallet (0x6e6d...21f9)',
			token1: 'ETH',
			token2: 'SNT',
			onClick: () => (state = 'type-amount'),
		},
		{
			title: '(0x6e6d...21f9)',
			token1: 'DAI',
			token2: 'SNT',
			onClick: () => (state = 'type-amount'),
		},
	]

	let state: 'select-wallet' | 'type-amount' | 'send-request' = 'select-wallet'
	let amt = ''
	let currency: 'ETH' | 'SNT' | 'DAI' = 'ETH'
</script>

<div class="request-wrapper">
	{#if state === 'select-wallet'}
		<Header title="Request transaction">
			<!-- TODO: fix on:click action -->
			<Button
				slot="right"
				icon={Close}
				border={false}
				variant="nopad"
				on:click={() => goto(ROUTES.HOME)}
			/>
		</Header>
		<Container>
			<h2>Please select the wallet where you want to receive the funds.</h2>
			{#each wallets as wallet}
				<Card {...wallet} />
			{/each}
			<Button icon={Add}>New wallet</Button>
		</Container>
	{:else if state === 'type-amount'}
		<Header title="Request transaction">
			<Button
				slot="left"
				icon={ArrowLeft}
				border={false}
				variant="nopad"
				on:click={() => (state = 'select-wallet')}
			/>
			<Button
				slot="right"
				icon={Close}
				border={false}
				variant="nopad"
				on:click={() => goto(ROUTES.HOME)}
			/>
		</Header>
		<Container>
			<div class="how-much">
				<h2>How much would you like to receive?</h2>
				<div class="amt-field">
					<Textarea placeholder="0.0000" bind:value={amt} />
					<Dropdown>
						<Button slot="button" iconEnd={Sort} variant="square" border={true} large={true}
							>{currency}</Button
						>
						<DropdownItem onClick={() => (currency = 'ETH')}>ETH</DropdownItem>
						<DropdownItem onClick={() => (currency = 'SNT')}>SNT</DropdownItem>
						<DropdownItem onClick={() => (currency = 'DAI')}>DAI</DropdownItem>
					</Dropdown>
				</div>
				<div class="converted">(0 USD)</div>
			</div>
			<Button icon={ArrowRight} variant="square" on:click={() => (state = 'send-request')} />
		</Container>
	{:else if state === 'send-request'}
		<Header title="Request transaction">
			<Button
				slot="left"
				icon={ArrowLeft}
				border={false}
				variant="nopad"
				on:click={() => (state = 'type-amount')}
			/>
			<Button
				slot="right"
				icon={Close}
				border={false}
				variant="nopad"
				on:click={() => goto(ROUTES.HOME)}
			/>
		</Header>
		<Container>
			<div class="item">
				<span class="label">
					Requested amount
					<Edit size={20} />
				</span>
				<div class="gray-bg">
					<span class="amt"> {amt} {currency} </span>
					<span> (Approx. ?? USD) </span>
				</div>
			</div>
			<div class="item">
				<span class="label">
					To
					<Edit size={20} />
				</span>
				<div class="gray-bg">
					<span class="wallet"> Main wallet (0x6e6d...21f9) </span>
					<span> ETH 0.029900675925729405 </span>
				</div>
			</div>
			<Button icon={Checkmark} on:click={() => goto(ROUTES.HOME)}>Add to chat</Button>
		</Container>
	{:else}
		<Container>
			<h2>How did I get here?</h2>
		</Container>
	{/if}
</div>

<style lang="scss">
	.request-wrapper {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	h2 {
		margin-bottom: calc(var(--spacing-12) + var(--spacing-6));
	}

	.how-much {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.amt-field {
		display: flex;
		align-items: center;
		gap: var(--spacing-12);
	}

	.label {
		display: flex;
		justify-content: space-between;
	}
	.item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		margin-bottom: var(--spacing-12);
		.amt {
			font-size: var(--font-size-20);
			font-weight: var(--font-weight-600);
		}
		.wallet {
			font-size: var(--font-size-16);
			font-weight: var(--font-weight-600);
		}
	}
	.label {
		display: flex;
		gap: var(--spacing-6);
		justify-content: space-between;
	}
	.gray-bg {
		background-color: var(--color-grey-bg);
		padding: var(--spacing-12);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}
</style>
