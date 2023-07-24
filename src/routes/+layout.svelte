<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/source-sans-pro' // Defaults to weight 400 with all styles included.
	import '@fontsource/source-sans-pro/600.css'
	import '@fontsource/source-sans-pro/700.css'
	import './styles.css'

	import { onDestroy, onMount } from 'svelte'
	import adapter from '$lib/adapters'
	import { walletStore } from '$lib/stores/wallet'

	let pageBg = 'white'

	let unsubscribeWalletStore: (() => void) | undefined = undefined

	onMount(() => {
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
	})
</script>

<div class="root" style={`background-color: ${pageBg};`}>
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
	}
</style>
