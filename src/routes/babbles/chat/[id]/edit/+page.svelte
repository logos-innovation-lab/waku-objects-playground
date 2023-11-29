<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'

	import { chats } from '$lib/stores/chat'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import Logout from '$lib/components/icons/logout.svelte'
	import ROUTES from '$lib/routes'
	import Loading from '$lib/components/loading.svelte'
	import CopyLink from '$lib/components/icons/copy-link.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import QRCode from '@bonosoft/sveltekit-qrcode'
	import copy from 'copy-to-clipboard'

	$: chatId = $page.params.id
	$: groupChat = $chats.chats.get(chatId)
	$: shareLink = $page.url.href.replace('/edit', '')

	const screen = 'settings'
	let buttonDisabled = false
	let copied = false

	function copyToClipboard() {
		copy(shareLink)
		copied = true
	}

	function leaveGroup() {
		chats.removeChat($page.params.id)
		goto(ROUTES.HOME)
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if $chats.loading}
		<Layout>
			<Container align="center" grow gap={6} justify="center">
				<Loading />
			</Container>
		</Layout>
	{:else if !groupChat}
		<Layout>
			<Container align="center" grow gap={6} justify="center">
				<h2>Could not find babbles.</h2>
			</Container>
		</Layout>
	{:else if screen === 'settings'}
		<Layout>
			<svelte:fragment slot="header">
				<Header title="Babbles settings">
					<svelte:fragment slot="left">
						<div class="header-btns">
							<Button variant="icon" on:click={() => history.go(-1)}>
								<ChevronLeft />
							</Button>
						</div>
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			<Container gap={12} justify="flex-start" align="center" padX={24} padY={24}>
				<p class="text-lg text-bold">Show QR code or share link below</p>
				<div class="qr">
					<QRCode content={$page.url.href} size={'250'} padding={'0'} />
				</div>
			</Container>
			<Container padY={0}>
				<ReadonlyText label="Invitation link" marginBottom={0}>
					{shareLink}
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
			<Divider padTop={24} />
			<Container gap={12} alignItems="center" padY={24}>
				<Button disabled={buttonDisabled} on:click={() => leaveGroup()}>
					<Logout />
					Leave babbles
				</Button>
			</Container>
		</Layout>
	{/if}
</AuthenticatedOnly>

<style lang="scss">
</style>
