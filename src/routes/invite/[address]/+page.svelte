<script lang="ts">
	import copy from 'copy-to-clipboard'
	import QRCode from '@bonosoft/sveltekit-qrcode'

	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import CopyLink from '$lib/components/icons/copy-link.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	import UserFollow from '$lib/components/icons/user-follow.svelte'
	import Login from '$lib/components/icons/login.svelte'

	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { page } from '$app/stores'
	import type { DraftChat } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import { profile } from '$lib/stores/profile'
	import adapters from '$lib/adapters'
	import { Html5Qrcode } from 'html5-qrcode'
	import Camera from '$lib/components/icons/camera.svelte'

	let copied = false
	let loading = false
	function copyToClipboard() {
		copy($page.url.href)
		copied = true
	}
	let scanning = false

	let html5Qrcode: Html5Qrcode

	function start() {
		html5Qrcode = new Html5Qrcode('reader')
		html5Qrcode.start(
			{ facingMode: 'environment' },
			{
				fps: 10,
				qrbox: { width: 250, height: 250 },
			},
			onScanSuccess,
			onScanFailure,
		)
		scanning = true
	}

	async function stop() {
		if (html5Qrcode) await html5Qrcode.stop()
		scanning = false
	}

	function onScanSuccess(decodedText: string) {
		// Regular expression to match last part of URL after last /
		const regex = /\/([^/]*)$/

		// Execute regex on URL
		const match = decodedText.match(regex)

		// If match found, return it, otherwise return null
		if (match && match[1]) {
			goto(routes.INVITE(match[1]))
		}
	}

	function onScanFailure(error: string) {
		console.warn(`Code scan error = ${error}`)
	}

	async function startChat() {
		const wallet = $walletStore.wallet
		if (!wallet) return

		loading = true

		const chat: DraftChat = {
			users: [$page.params.address, wallet.address],
			messages: [],
		}
		const chatId = await adapters.startChat(wallet.address, chat)
		loading = false
		goto(routes.CHAT(chatId))
	}
</script>

<Header title="Invite to chat">
	<Button slot="left" variant="icon" on:click={() => history.back()}>
		<ChevronLeft />
	</Button>
</Header>

{#if $walletStore.loading || $profile.loading}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else if $walletStore.wallet?.address === $page.params.address}
	<Container gap={12} grow justify="flex-start" align="center" padX={24} padY={24}>
		<p class="text-lg text-bold">Show QR code or share link below</p>
		<div class="qr">
			{#if !scanning}
				<QRCode content={$page.url.href} size={'250'} padding={'0'} />
			{/if}
			<div id="reader" class={`${!scanning ? 'hidden' : ''}`} />
			{#if !scanning}
				<Button on:click={start} variant="strong">
					<Camera />
					Scan QR code
				</Button>
			{:else}
				<Button on:click={stop} variant="strong">Show my QR code</Button>
			{/if}
		</div>
		<div class="link">
			<Textarea label="Invitation link" readonly placeholder={$page.url.href} height={96} />
		</div>
		<Button on:click={copyToClipboard} variant="strong">
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
	<Container gap={6} grow justify="center" align="center" padX={24}>
		<p class="text-lg text-bold">Start chatting</p>
		<p class="text-lg description">
			Click the button below to start a new chat with {$page.params.address}
		</p>
		<Button on:click={startChat}>
			<CopyLink />
			Start new chat
		</Button>
	</Container>
{:else}
	<Container align="center" alignItems="center" gap={12} justify="center" grow padX={24}>
		<div class="chatbot">
			<div>
				<ChatBot size={32} />
			</div>
			<p class="text-lg text-bold">Waku chats</p>
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
	.qr {
		padding-block: 7px;
	}
	.link {
		width: calc(100% + var(--spacing-24));
	}

	#reader {
		width: 250px;
		height: 250px;
	}
	.hidden {
		display: none;
	}
</style>
