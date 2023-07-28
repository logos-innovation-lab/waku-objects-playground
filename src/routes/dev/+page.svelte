<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Asset from '$lib/components/asset.svelte'
	import { walletStore } from '$lib/stores/wallet'
	import Button from '$lib/components/button.svelte'
	import { balanceStore } from '$lib/stores/balances'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import { fetchBalances } from '$lib/adapters/balance'

	function initializeTokenBalances() {
		const wallet = $walletStore.wallet

		if (!wallet) {
			return
		}
		fetchBalances(wallet.address)
	}
</script>

<Header title="DEV DASHBOARD" />
<Container>
	<section>
		<div class="label">Network</div>
		<div class="value">{defaultBlockchainNetwork.name}</div>
	</section>
	<Divider />
	<section class="assets">
		<Button disabled={!$walletStore.wallet} on:click={initializeTokenBalances}
			>Initialize token balances</Button
		>
		{#if $balanceStore.loading}
			<Container align="center">
				<h2>Loading...</h2>
			</Container>
		{/if}
		{#each $balanceStore.balances as balance}
			<Asset
				name={balance.name}
				token={balance.symbol}
				amount={balance.amount}
				decimals={balance.decimals}
				image={balance.image}
			/>
		{/each}
	</section>
</Container>

<style lang="scss">
	section {
		margin-top: 1rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.assets {
		align-items: stretch;
	}

	.label {
		font-family: var(--font-body);
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--color-step-50, var(--color-dark-step-10));
		margin-bottom: var(--spacing-4);
	}

	.value {
		font-family: var(--font-serif);
	}
</style>
