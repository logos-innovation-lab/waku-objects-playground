<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import Renew from '$lib/components/icons/renew.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import InputFile from '$lib/components/input-file.svelte'

	import { chats } from '$lib/stores/chat'
	import { clipAndResize } from '$lib/utils/image'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import { onDestroy } from 'svelte'
	import Logout from '$lib/components/icons/logout.svelte'
	import ROUTES from '$lib/routes'
	import Loading from '$lib/components/loading.svelte'
	import { errorStore } from '$lib/stores/error'
	import CopyLink from '$lib/components/icons/copy-link.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import QRCode from '@bonosoft/sveltekit-qrcode'
	import copy from 'copy-to-clipboard'

	$: chatId = $page.params.id
	$: groupChat = $chats.chats.get(chatId)
	$: shareLink = $page.url.href.replace('/edit', '')
	let picture: string | undefined
	let name: string | undefined

	$: if (groupChat) {
		picture = picture ?? groupChat.avatar
		name = name ?? groupChat.name
	}

	const screen = 'settings'
	let pictureFiles: FileList | undefined = undefined
	let buttonDisabled = false
	let copied = false

	function copyToClipboard() {
		copy(shareLink)
		copied = true
	}

	async function resizePicture(p?: File) {
		try {
			picture = p ? await uploadPicture(await clipAndResize(p, 200, 200)) : picture
		} catch (e) {
			errorStore.addStart({
				title: 'Profile Error',
				message: `Failed to upload profile picture. ${(e as Error)?.message}`,
				retry: () => resizePicture(p),
				ok: true,
			})
		}
	}
	$: resizePicture(pictureFiles && pictureFiles[0])

	$: if (
		!$chats.loading &&
		((name && name !== groupChat?.name) || (picture && picture !== groupChat?.avatar))
	) {
		debounceSaveProfile()
	}

	let timer: ReturnType<typeof setTimeout> | undefined

	async function saveProfileNow() {
		if (!groupChat) {
			return
		}
		chats.updateChat(chatId, (chat) => ({
			...chat,
			name: name,
			avatar: picture,
		}))
	}

	// Debounce saving profile
	function debounceSaveProfile() {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			saveProfileNow()
			timer = undefined
		}, 1000)
	}

	onDestroy(() => {
		if (timer) {
			clearTimeout(timer)
			saveProfileNow()
		}
	})

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
			<Container gap={12}>
				<Avatar group {picture} seed={chatId} size={140} />
				<InputFile bind:files={pictureFiles}>
					<Renew />
					Change picture
				</InputFile>
				<InputField autofocus bind:value={name} label="Group name" />
			</Container>
			<Divider padTop={24} />
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