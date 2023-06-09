<script lang="ts">
	import copy from 'copy-to-clipboard'

	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Copy from '$lib/components/icons/copy.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Badge from '$lib/components/badge.svelte'
	import Asset from '$lib/components/asset.svelte'

	import { profile } from '$lib/stores/profile'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import { balanceStore } from '$lib/stores/balances'
	import { onMount } from 'svelte'
	import adapter from '$lib/adapters'

	let copied = false
	function copyAddressToClipboard() {
		const address = $walletStore.wallet?.address
		if (address === undefined) return

		copy(address)
		copied = true
	}

	onMount(() => {
		const address = $walletStore.wallet?.address
		if (address === undefined) return

		adapter.initializeBalances(address)
	})
</script>

<Header title="Account">
	<Button slot="left" variant="icon" on:click={() => goto(routes.IDENTITY)}>
		<ChevronLeft />
	</Button>
</Header>
{#if $profile.loading}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $profile.error}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Failed to load profile: {$profile.error.message}</h2>
	</Container>
{:else}
	<Container gap={6} align="center" padX={24}>
		<p class="text-lg text-bold pad">Address</p>
		<p class="text-lg">This address is used to send and receive tokens with Waku objects</p>
	</Container>
	<Container gap={6}>
		<Textarea value={$walletStore.wallet?.address} readonly label="Account address" />
		<Button on:click={copyAddressToClipboard}>
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
	<Container align="center" direction="row" gap={6} justify="center" padX={24}>
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
			/>
		{/each}
	</div>
{/if}

<style lang="scss">
	.pad {
		padding-top: var(--spacing-12);
	}
</style>
