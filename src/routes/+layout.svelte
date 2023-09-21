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

	let unsubscribeWalletStore: (() => void) | undefined = undefined
	let unsubscribeExchangeStore: (() => void) | undefined = undefined

	onMount(() => {
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
	})

	onDestroy(() => {
		if ($walletStore.wallet) adapter.onLogOut()
		if (unsubscribeWalletStore) unsubscribeWalletStore()
		if (unsubscribeExchangeStore) unsubscribeExchangeStore()
	})

	$: changeColors($theme.baseColor, $theme.darkMode)
</script>

<div class="root">
	<slot />
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
