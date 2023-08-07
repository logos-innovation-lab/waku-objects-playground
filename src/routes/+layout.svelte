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
	import Container from '$lib/components/container.svelte'
	import { goto } from '$app/navigation'
	import Button from '$lib/components/button.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	import Login from '$lib/components/icons/login.svelte'
	import UserFollow from '$lib/components/icons/user-follow.svelte'
	import routes from '$lib/routes'

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

	$: noWallet = !$walletStore.wallet && !$walletStore.loading
</script>

<div class="root">
	{#if $walletStore.loading}
		<Container align="center" grow gap={6} justify="center">
			<div class="center">
				<h2>Loading...</h2>
			</div>
		</Container>
	{:else if noWallet}
		<Container align="center" alignItems="center" gap={12} justify="center" grow padX={24}>
			<div class="chatbot">
				<div>
					<ChatBot size={32} />
				</div>
				<p class="text-lg text-bold">Waku Play</p>
			</div>
			<Button on:click={() => goto(routes.IDENTITY_NEW)}>
				<UserFollow />
				Create new identity
			</Button>
			<Button on:click={() => goto(routes.IDENTITY_CONNECT)}>
				<Login />
				Connect existing identity
			</Button>
		</Container>
	{:else}
		<slot />
	{/if}
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
		background-color: var(--color-base, var(--color-dark-accent));
	}
</style>
