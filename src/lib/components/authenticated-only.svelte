<script lang="ts">
	import routes from '$lib/routes'

	import { profile } from '$lib/stores/profile'

	import { walletStore } from '$lib/stores/wallet'

	import { goto } from '$app/navigation'

	import Button from './button.svelte'

	import Container from '$lib/components/container.svelte'

	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	import Login from '$lib/components/icons/login.svelte'
	import UserFollow from '$lib/components/icons/user-follow.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'

	$: wallet = $walletStore.wallet

	interface $$Slots {
		default: {
			wallet: HDNodeWallet
		}
	}
</script>

{#if $profile.loading || $walletStore.loading}
	<Container align="center" gap={6} justify="center">
		<h2>Loading...</h2>
	</Container>
{:else if $profile.error}
	<Container align="center" gap={6} justify="center" padX={24}>
		<h2>Failed to load profile: {$profile.error.message}</h2>
	</Container>
{:else if wallet !== undefined}
	<slot {wallet} />
{:else}
	<Container align="center" alignItems="center" gap={12} justify="center" padX={24}>
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
{/if}

<style lang="scss">
	.chatbot {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		margin-bottom: var(--spacing-12);
		div {
			line-height: 0;
		}
	}
</style>
