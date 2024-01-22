<script lang="ts">
	import copy from 'copy-to-clipboard'
	import { ChevronLeft, Copy, Checkmark } from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Badge from '$lib/components/badge.svelte'
	import Asset from '$lib/components/asset.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'

	import { profile } from '$lib/stores/profile'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import { balanceStore } from '$lib/stores/balances'
	import { fetchBalances } from '$lib/adapters/balance'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import { exchangeStore } from '$lib/stores/exchangeRates'
	import { preferences } from '$lib/stores/preferences'
	import Loading from '$lib/components/loading.svelte'

	let copied = false
	$: address = $walletStore.wallet?.address

	$: if (address) fetchBalances(address)

	function copyAddressToClipboard(address: string) {
		copy(address)
		copied = true
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Account">
			<Button slot="left" variant="icon" on:click={() => goto(routes.IDENTITY)}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>

	<AuthenticatedOnly let:wallet>
		{#if $profile.loading}
			<Container align="center" gap={6} justify="center" padX={24}>
				<Loading />
			</Container>
		{:else if $profile.error}
			<Container align="center" gap={6} justify="center" padX={24}>
				<h2>Failed to load profile: {$profile.error.message}</h2>
			</Container>
		{:else}
			<Container gap={6} align="center" padX={24}>
				<p class="text-lg text-bold pad">Address</p>
				<p class="text-lg">This address is used to send and receive tokens with Waku objects</p>
			</Container>
			<Container gap={6}>
				<ReadonlyText label="Account address" breakWord>
					{wallet.address}
				</ReadonlyText>
				<Button on:click={() => copyAddressToClipboard(wallet.address)}>
					{#if copied}
						<Checkmark />
						Copied
					{:else}
						<Copy />
						Copy
					{/if}
				</Button>
			</Container>
			<Divider pad={12} />
			<Container justify="center" align="center" direction="row" gap={6} padX={24}>
				Assets <Badge dark>{$balanceStore.balances.length}</Badge>
			</Container>
			<Divider pad={12} padBottom={0} />
			<div class="assets">
				{#each $balanceStore.balances as balance}
					<Asset
						name={balance.name}
						token={balance.symbol}
						amount={balance.amount}
						decimals={balance.decimals}
						image={balance.image}
						fiatSymbol={$preferences.fiatSymbol}
						fiatExchange={$exchangeStore.exchange.get(balance.symbol)?.rates[
							$preferences.fiatSymbol
						]}
					/>
				{/each}
			</div>
		{/if}
	</AuthenticatedOnly>
</Layout>

<style lang="scss">
	.pad {
		padding-top: var(--spacing-12);
	}
</style>
