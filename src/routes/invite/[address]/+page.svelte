<script lang="ts">
	import copy from 'copy-to-clipboard'
	import QRCode from '@bonosoft/sveltekit-qrcode'

	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import CopyLink from '$lib/components/icons/copy-link.svelte'

	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { page } from '$app/stores'
	import { type DraftChat, chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import { Html5Qrcode } from 'html5-qrcode'
	import Camera from '$lib/components/icons/camera.svelte'
	import QrCodeIcon from '$lib/components/icons/qr-code.svelte'
	import { onDestroy } from 'svelte'
	import ButtonBlock from '$lib/components/button-block.svelte'
	import User from '$lib/components/icons/user.svelte'
	import ChevronRight from '$lib/components/icons/chevron-right.svelte'
	import Layout from '$lib/components/layout.svelte'
	import type { User as UserType } from '$lib/types'
	import { profile } from '$lib/stores/profile'
	import { walletStore } from '$lib/stores/wallet'
	import Avatar from '$lib/components/avatar.svelte'

	// check if the chat already exists
	$: if ($chats.chats.has($page.params.address)) {
		goto(routes.CHAT($page.params.address))
	}

	let copied = false
	let loading = false
	function copyToClipboard() {
		copy($page.url.href)
		copied = true
	}
	let scanning = false

	let html5Qrcode: Html5Qrcode

	let counterParty: UserType | undefined = undefined
	$: if (
		!counterParty &&
		!$profile.loading &&
		!$walletStore.loading &&
		$walletStore.wallet?.address !== $page.params.address
	) {
		adapters
			.getUserProfile($page.params.address)
			.then((user) => {
				counterParty = user
			})
			.catch(console.error)
	}

	function start() {
		html5Qrcode = new Html5Qrcode('reader')
		html5Qrcode.start(
			{ facingMode: 'environment' },
			{
				fps: 10,
				qrbox: { width: 250, height: 250 },
				aspectRatio: 1,
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

	async function onScanSuccess(decodedText: string) {
		// Regular expression to match last part of URL after last /
		const regex = /\/([^/]*)$/

		// Execute regex on URL
		const match = decodedText.match(regex)

		// If match found, return it, otherwise return null
		if (match && match[1]) {
			await stop()
			goto(routes.INVITE(match[1]))
		}
	}

	function onScanFailure(error: string) {
		console.warn(`Code scan error = ${error}`)
	}

	async function startChat(address: string) {
		loading = true

		const chat: DraftChat = {
			users: [$page.params.address, address],
		}
		const chatId = await adapters.startChat(address, chat)
		loading = false
		goto(routes.CHAT(chatId))
	}

	onDestroy(() => {
		stop()
	})
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Invite to chat">
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<AuthenticatedOnly let:wallet>
		{#if wallet && $chats.loading}
			<Container align="center" gap={6} justify="center">
				<div class="center">
					<h2>Loading...</h2>
				</div>
			</Container>
		{:else if wallet.address === $page.params.address}
			<ButtonBlock borderBottom on:click={() => goto(routes.GROUP_NEW)}>
				<Container direction="row" justify="space-between" align="center" alignItems="center">
					<div class="icon">
						<User size={20} /> Create group
					</div>
					<div>
						<Button variant="icon">
							<ChevronRight />
						</Button>
					</div>
				</Container>
			</ButtonBlock>
			<Container gap={12} justify="flex-start" align="center" padX={24} padY={24}>
				<p class="text-lg text-bold">Show QR code or share link below</p>
				<div class="qr">
					{#if !scanning}
						<QRCode content={$page.url.href} size={'250'} padding={'0'} />
					{/if}
					<div id="reader" class={`${!scanning ? 'hidden' : ''}`} />
					{#if !scanning}
						<Button on:click={start}>
							<Camera />
							Scan QR code
						</Button>
					{:else}
						<Button on:click={stop}><QrCodeIcon />Show my QR code</Button>
					{/if}
				</div>
			</Container>
			<Container padY={0}>
				<ReadonlyText label="Invitation link" marginBottom={0}>
					{$page.url.href}
				</ReadonlyText>
			</Container>
			<Container padY={12} padX={24}>
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
		{:else}
			<Container gap={6} justify="center" align="center" padX={24}>
				<Avatar picture={counterParty?.avatar} size={140} />
				<p class="text-lg text-bold">Chat with {counterParty?.name ?? $page.params.address}</p>
				<p class="text-lg description">
					Connect with {counterParty?.name ?? $page.params.address} and start a private chat on Waku
					chats
				</p>
				<Button on:click={() => startChat(wallet.address)}>
					<CopyLink />
					Start new chat
				</Button>
			</Container>
		{/if}
	</AuthenticatedOnly>
</Layout>

<style lang="scss">
	.qr {
		padding-block: 7px;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
	}

	#reader {
		width: 250px;
		height: 250px;
		margin: 2px;
	}
	.hidden {
		display: none;
	}
	.icon {
		display: flex;
		gap: var(--spacing-6);
		justify-content: center;
	}
</style>
