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
</script>

<Container gap={12}>
	{#if state === 'select-wallet'}
		<Header title="Request transaction">
			<Button
				slot="right"
				icon={Close}
				border={false}
				variant="nopad"
				on:click={() => goto(ROUTES.HOME)}
			/>
		</Header>
		<h2>Please select the wallet where you want to receive the funds.</h2>
		{#each wallets as wallet}
			<Card {...wallet} />
		{/each}
		<Button icon={Add}>New wallet</Button>
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
		<h2>How much would you like to receive?</h2>
		<div class="amt-field">
			<Textarea placeholder="0.0000" />
			<Dropdown>
				<Button slot="button" icon={Sort} variant="nopad" border={false}>ETH</Button>
				<DropdownItem onClick={() => console.log('ETH')}>ETH</DropdownItem>
				<DropdownItem onClick={() => console.log('SNT')}>SNT</DropdownItem>
				<DropdownItem onClick={() => console.log('DAI')}>DAI</DropdownItem>
			</Dropdown>
		</div>
		<Button icon={ArrowRight} variant="square" on:click={() => (state = 'send-request')} />
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
		<div class="item">
			<span class="label">
				Requested amount
				<Edit size={20} />
			</span>
			<div class="gray-bg">
				<span> 0.057 ETH </span>
				<span> (Approx. 103.11 USD) </span>
			</div>
		</div>
		<div class="item">
			<span class="label">
				To
				<Edit size={20} />
			</span>
			<div class="gray-bg">
				<span> Main wallet (0x6e6d...21f9) </span>
				<span> ETH 0.029900675925729405 </span>
			</div>
		</div>
		<Button icon={Checkmark} on:click={() => goto(ROUTES.HOME)}>Add to chat</Button>
	{:else}
		<h2>How did I get here?</h2>
	{/if}
</Container>

<style lang="scss">
	h2 {
		margin-bottom: var(--spacing-12);
	}

	.amt-field {
		display: flex;
		gap: var(--spacing-12);
	}

	.label {
		display: flex;
		justify-content: space-between;
	}
</style>
