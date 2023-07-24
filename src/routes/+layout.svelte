<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/source-sans-pro' // Defaults to weight 400 with all styles included.
	import '@fontsource/source-sans-pro/600.css'
	import '@fontsource/source-sans-pro/700.css'
	import './styles.css'

	import { onDestroy, onMount } from 'svelte'
	import adapter from '$lib/adapters'
	import { walletStore } from '$lib/stores/wallet'
	import { changeColors } from '$lib/utils/color'
	import { theme } from '$lib/stores/theme'

	let unsubscribeWalletStore: (() => void) | undefined = undefined
	let unsubscribeThemeStore: (() => void) | undefined = undefined

	onMount(() => {
		unsubscribeThemeStore = theme.subscribe((theme) => {
			changeColors(theme.baseColor, theme.darkMode)
		})
		unsubscribeWalletStore = walletStore.subscribe(({ wallet }) => {
			if (wallet) {
				adapter.onLogIn(wallet)
			} else {
				adapter.onLogOut()
			}
		})
	})

	onDestroy(() => {
		if ($walletStore.wallet) adapter.onLogOut()
		if (unsubscribeWalletStore) unsubscribeWalletStore()
		if (unsubscribeThemeStore) unsubscribeThemeStore()
	})
</script>

<div class="root">
	<slot />
</div>

<style>
	.root {
		min-height: 100vh;
		min-height: 100dvh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		margin-inline: auto;
		position: relative;
		background-color: var(--color-base);
	}
</style>
