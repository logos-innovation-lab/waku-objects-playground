<script lang="ts">
	import copy from 'copy-to-clipboard'

	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import CopyLink from '$lib/components/icons/copy-link.svelte'

	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { page } from '$app/stores'
	import { walletStore } from '$lib/stores/wallet'
	import adapters from '$lib/adapters'
	import type { DraftChat } from '$lib/stores/chat'

	let copied = false
	let loading = false
	function copyToClipboard() {
		copy($page.url.href)
		copied = true
	}

	async function startChat() {
		const wallet = $walletStore.wallet
		if (!wallet) return

		loading = true

		const chat: DraftChat = {
			users: [$page.params.address, wallet.address],
			messages: [],
		}
		const chatId = await adapters.startChat(wallet, chat)
		loading = false
		goto(routes.CHAT(chatId))
	}
</script>

<Header title="Invite to chat">
	<Button slot="left" variant="icon" on:click={() => goto(routes.HOME)}>
		<ChevronLeft />
	</Button>
</Header>

{#if $walletStore.loading}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else if !$walletStore.wallet}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Connect your wallet to start chatting</h2>
			<p>TODO: there should be some create identity flow</p>
		</div>
	</Container>
{:else if $walletStore.wallet?.address === $page.params.address}
	<Container gap={6} grow justify="center" align="center" pad={24}>
		<p class="text-lg text-bold">Share link</p>
		<p class="text-lg description">Share the link below with anyone to start a new chat together</p>
		<Textarea rows={4} nonEditable placeholder={$page.url.href} />
		<Button on:click={copyToClipboard}>
			{#if copied}
				<Checkmark />
				Copied
			{:else}
				<CopyLink />
				Copy link
			{/if}
		</Button>
	</Container>
{:else if $walletStore.wallet}
	<Container gap={6} grow justify="center" align="center" pad={24}>
		<p class="text-lg text-bold">Start chatting</p>
		<p class="text-lg description">
			Click the button below to start a new chat with {$page.params.address}
		</p>
		<Button on:click={startChat}>
			<CopyLink />
			Start new chat
		</Button>
	</Container>
{/if}

<style lang="scss">
</style>
