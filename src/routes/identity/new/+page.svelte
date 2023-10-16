<script lang="ts">
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Renew from '$lib/components/icons/renew.svelte'

	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import InputField from '$lib/components/input-field.svelte'

	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import { clipAndResize } from '$lib/utils/image'
	import routes from '$lib/routes'
	import { HDNodeWallet, Wallet } from 'ethers'
	import { walletStore } from '$lib/stores/wallet'
	import Layout from '$lib/components/layout.svelte'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import Avatar from '$lib/components/avatar.svelte'
	import { errorStore } from '$lib/stores/error'

	let picture = ''
	let name = ''
	let saving = false
	let isCreatingIdentity = false
	let wallet: HDNodeWallet | undefined = undefined

	createIdentity()

	let pictureFiles: FileList | undefined = undefined
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

	async function saveProfile() {
		saving = true
		try {
			if (!wallet) throw new Error('no wallet')

			await adapters.saveUserProfile(wallet.address, name, picture)
			walletStore.saveWallet(wallet)
			goto(routes.IDENTITY_CONFIRM)
		} catch (e) {
			errorStore.addStart({
				title: 'Profile Error',
				message: `Failed to save profile. ${(e as Error)?.message}`,
				retry: saveProfile,
			})
		}
		saving = false
	}

	async function createIdentity() {
		isCreatingIdentity = true
		try {
			wallet = Wallet.createRandom()
		} catch (e) {
			errorStore.addStart({
				title: 'Wallet Error',
				message: `Failed to create identity. ${(e as Error)?.message}`,
				retry: createIdentity,
			})
		}
		isCreatingIdentity = false
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Create new identity">
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={12} justify="center">
		<div class="avatar">
			<Avatar size={140} {picture} seed={wallet?.address} />
		</div>
		<InputFile bind:files={pictureFiles}>
			<Renew />
			Change picture
		</InputFile>
		<InputField autofocus bind:value={name} label="Display name" />
	</Container>
	<Container grow justify="flex-end">
		<Button
			variant="strong"
			disabled={isCreatingIdentity || !name || saving || !wallet}
			on:click={saveProfile}
		>
			<ArrowRight />
		</Button>
	</Container>
</Layout>

<style lang="scss">
	.avatar {
		margin: var(--spacing-12) auto 0;
		border-radius: 100px;
	}
</style>
