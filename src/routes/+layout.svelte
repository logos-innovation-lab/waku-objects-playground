<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/source-sans-pro' // Defaults to weight 400 with all styles included.
	import '@fontsource/source-sans-pro/600.css'
	import '@fontsource/source-sans-pro/700.css'
	import './styles.css'

	import { onDestroy, onMount } from 'svelte'
	import adapter from '$lib/adapters'
	import { changeColors } from '$lib/utils/color'
	import Checkmark from '$lib/components/icons/checkmark.svelte'

	import { walletStore } from '$lib/stores/wallet'
	import { theme } from '$lib/stores/theme'
	import { exchangeStore } from '$lib/stores/exchangeRates'
	import { errorStore, type ErrorDescriptor } from '$lib/stores/error'
	import { defaultBlockchainNetwork, getChainId } from '$lib/adapters/transaction'
	import Container from '$lib/components/container.svelte'
	import Loading from '$lib/components/loading.svelte'
	import ErrorModal from '$lib/components/error-modal.svelte'
	import Button from '$lib/components/button.svelte'
	import Renew from '$lib/components/icons/renew.svelte'

	let unsubscribeWalletStore: (() => void) | undefined = undefined
	let unsubscribeExchangeStore: (() => void) | undefined = undefined
	let loading = true

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

		try {
			// Ensures the blockchain connection is on the correct network
			const chainId = await getChainId()
			if (defaultBlockchainNetwork.chainId !== chainId) {
				errorStore.addStart({
					title: 'Blockchain error',
					message: `You are trying to connect to incorrect blockchain. Got chain ID ${chainId.toString()}, expected ${defaultBlockchainNetwork.chainId.toString()}`,
					reload: true,
				})
			}
		} catch (err) {
			errorStore.addStart({
				title: 'Blockchain error',
				message: `Connection to blockchain failed. ${(err as Error).message}`,
				reload: true,
			})
		}
		loading = false
	})

	onDestroy(() => {
		if ($walletStore.wallet) adapter.onLogOut()
		if (unsubscribeWalletStore) unsubscribeWalletStore()
		if (unsubscribeExchangeStore) unsubscribeExchangeStore()
	})

	$: changeColors($theme.baseColor, $theme.darkMode)

	const resolveError =
		(error: ErrorDescriptor, handler: () => Promise<void> | void) => async () => {
			await handler()
			errorStore.resolve(error)
		}
</script>

<div class="root">
	{#if $errorStore.length > 0}
		{@const error = $errorStore[0]}
		<ErrorModal title={error.title} message={error.message}>
			{#if error.actions !== undefined}
				{#each error.actions as action}
					<Button variant={action.variant ?? ''} on:click={resolveError(error, action.handler)}>
						<svelte:component this={action.icon} />{action.label}
					</Button>
				{/each}
			{/if}
			{#if error.ok}
				<Button on:click={() => errorStore.resolve(error)}>
					<Checkmark /> OK
				</Button>
			{/if}
			{#if error.reload}
				<Button variant="strong" on:click={resolveError(error, () => window.location.reload())}>
					<Renew /> Refresh
				</Button>
			{/if}
			{#if error.retry}
				<Button variant="strong" on:click={resolveError(error, error.retry)}>
					<Renew /> Refresh
				</Button>
			{/if}
		</ErrorModal>
	{/if}
	{#if loading}
		<Container align="center" gap={6} justify="center">
			<Loading />
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
