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

	let copied = false
	function copyAddressToClipboard() {
		const address = $walletStore.wallet?.address
		if (address === undefined) return

		copy(address)
		copied = true
	}
</script>

<Header title="Account">
	<Button slot="left" variant="icon" on:click={() => goto(routes.IDENTITY)}>
		<ChevronLeft />
	</Button>
</Header>
{#if $profile.loading}
	<Container align="center" grow gap={6} justify="center" pad={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $profile.error}
	<Container align="center" grow gap={6} justify="center" pad={24}>
		<h2>Failed to load profile: {$profile.error.message}</h2>
	</Container>
{:else}
	<Container gap={6} align="center" pad={24}>
		<p class="text-lg text-bold pad">Address</p>
		<p class="text-lg">This address is used to send and receive tokens with Waku objects</p>
	</Container>
	<Container gap={6}>
		<Textarea value={$walletStore.wallet?.address} nonEditable label="Account address" rows={2} />
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
	<Container align="center" direction="row" gap={6} justify="center" pad={24}>
		Assets <Badge dark>4</Badge>
	</Container>
	<Divider pad={12} padBottom={0} />
	<div class="assets">
		<Asset name="Ethereum" token="ETH" amount={0.011741} />
		<Asset name="Dai Stablecoin" token="DAI" amount={50} />
		<Asset name="Tether" token="USDT" amount={17} />
		<Asset name="USD Coin" token="USDC" amount={45} />
	</div>
{/if}

<style lang="scss">
	.pad {
		padding-top: var(--spacing-12);
	}
</style>
