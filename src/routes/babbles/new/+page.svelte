<script lang="ts">
	import { goto } from '$app/navigation'

	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'

	import routes from '$lib/routes'
	import Avatar from '$lib/components/avatar.svelte'
	import { chats } from '$lib/stores/chat'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import adapters from '$lib/adapters'
	import { clipAndResize } from '$lib/utils/image'
	import Renew from '$lib/components/icons/renew.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import Loading from '$lib/components/loading.svelte'
	import { errorStore } from '$lib/stores/error'
	import { bytesToHex } from '@waku/utils/bytes'
	import { randomBytes } from '@noble/ciphers/webcrypto/utils'

	const screen = 'details'
	let picture = ''
	let name = ''
	let pictureFiles: FileList | undefined = undefined
	let buttonDisabled = false
	const chatId = bytesToHex(randomBytes(32))

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

	async function createBabbles(wallet: HDNodeWallet) {
		buttonDisabled = true

		try {
			await adapters.startBabbles(wallet, chatId, name, picture)
		} catch (error) {
			errorStore.addEnd({
				title: 'Error',
				message: `Failed to create babbles. ${(error as Error)?.message}`,
				retry: () => createBabbles(wallet),
				ok: true,
			})
		}

		buttonDisabled = false

		goto(routes.BABBLES_CHAT(chatId))
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if $chats.loading}
		<Layout>
			<Container align="center" gap={6} justify="center">
				<Loading />
			</Container>
		</Layout>
	{:else if screen === 'details'}
		<Layout>
			<svelte:fragment slot="header">
				<Header mainContent="right" title="Set babbles details">
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
				<InputField autofocus bind:value={name} label="Babbles name" />
			</Container>
			<Container padX={0} padY={0} grow />
			<Container justify="flex-end">
				<Button
					variant="strong"
					disabled={buttonDisabled || name.length === 0}
					on:click={() => createBabbles(wallet)}
				>
					<Checkmark />
					Create babbles
				</Button>
			</Container>
		</Layout>
	{/if}
</AuthenticatedOnly>

<style lang="scss">
</style>
