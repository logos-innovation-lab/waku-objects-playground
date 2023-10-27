<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/source-sans-pro' // Defaults to weight 400 with all styles included.
	import '@fontsource/source-sans-pro/600.css'
	import '@fontsource/source-sans-pro/700.css'
	import './styles.css'

	import { onDestroy, onMount } from 'svelte'
	import adapter from '$lib/adapters'
	import { changeColors } from '$lib/utils/color'

	import { walletStore } from '$lib/stores/wallet'
	import { theme } from '$lib/stores/theme'
	import { exchangeStore } from '$lib/stores/exchangeRates'
	import { defaultBlockchainNetwork, getChainId } from '$lib/adapters/transaction'
	import Container from '$lib/components/container.svelte'
	import Loading from '$lib/components/loading.svelte'

	let unsubscribeWalletStore: (() => void) | undefined = undefined
	let unsubscribeExchangeStore: (() => void) | undefined = undefined
	let loading = true
	let error: string | undefined = undefined
	let isDarkQuery: MediaQueryList
	let isSystemDark: boolean | undefined

	onMount(async () => {
		unsubscribeWalletStore = walletStore.subscribe(({ wallet }) => {
			if (wallet) {
				adapter.onLogIn(wallet)
			} else {
				adapter.onLogOut()
			}
		})

		const MINUTE = 1000 * 60
		const interval = setInterval(exchangeStore.update, MINUTE)

		unsubscribeExchangeStore = () => clearInterval(interval)

		// Ensures the blockchain connection is on the correct network
		const chainId = await getChainId()
		if (defaultBlockchainNetwork.chainId !== chainId) {
			error = `Incorrect blockchain connection. Got chain ID ${chainId.toString()}, expected ${defaultBlockchainNetwork.chainId.toString()}`
		}
		loading = false

		isDarkQuery = window.matchMedia('(prefers-color-scheme: dark)')
		isDarkQuery.onchange = (event) => {
			isSystemDark = event.matches
		}
	})

	onDestroy(() => {
		if ($walletStore.wallet) adapter.onLogOut()
		if (unsubscribeWalletStore) unsubscribeWalletStore()
		if (unsubscribeExchangeStore) unsubscribeExchangeStore()
	})

	$: changeColors($theme.baseColor, $theme.darkMode, isSystemDark ?? isDarkQuery?.matches)
</script>

<svelte:head>
	<meta name="theme-color" content={$theme.baseColor} />
</svelte:head>

<div class="root">
	{#if loading}
		<Container align="center" gap={6} justify="center">
			<Loading />
		</Container>
	{:else if error !== undefined}
		<!-- FIXME: use the error component-->
		<Container align="center" gap={6} justify="center" padX={24}>
			<h2>{error}</h2>
		</Container>
	{:else}
		<slot />
	{/if}
</div>

<style>
	.root {
		min-height: 100vh;
		min-height: 100dvh;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		margin-inline: auto;
		position: relative;
		background-color: var(--color-base, var(--color-dark-accent));
	}
</style>
