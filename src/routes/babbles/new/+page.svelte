<script lang="ts">
	import { ChevronLeft, Checkmark, Renew } from 'carbon-icons-svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import { bytesToHex } from '@waku/utils/bytes'
	import { randomBytes } from '@noble/ciphers/webcrypto/utils'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Loading from '$lib/components/loading.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import { clipAndResize } from '$lib/utils/image'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import { errorStore } from '$lib/stores/error'

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
