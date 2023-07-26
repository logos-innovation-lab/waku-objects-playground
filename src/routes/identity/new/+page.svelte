<script lang="ts">
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import User from '$lib/components/icons/user.svelte'

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

	let picture = ''
	let name = ''
	let saving = false
	let isCreatingIdentity = false
	let wallet: HDNodeWallet | undefined = undefined

	createIdentity()

	let pictureFiles: FileList | undefined = undefined
	async function resizePersonaPicture(p?: File) {
		try {
			picture = p ? await adapters.uploadPicture(await clipAndResize(p, 200, 200)) : picture
		} catch (error) {
			console.error(error)
		}
	}
	$: resizePersonaPicture(pictureFiles && pictureFiles[0])

	async function saveProfile() {
		saving = true
		try {
			if (!wallet) throw new Error('no wallet')

			await adapters.saveUserProfile(wallet.address, name, picture)
			walletStore.saveWallet(wallet)
			goto(routes.IDENTITY_CONFIRM)
		} catch (error) {
			console.error('failed to save profile: ', error)
		}
		saving = false
	}

	async function createIdentity() {
		isCreatingIdentity = true
		try {
			wallet = Wallet.createRandom()
		} catch (e) {
			console.error(e)
		}
		isCreatingIdentity = false
	}
</script>

<Header title="Create new identity">
	<Button slot="left" variant="icon" on:click={() => history.back()}>
		<ChevronLeft />
	</Button>
</Header>

<Container gap={12}>
	<div class="avatar">
		{#if picture}
			<div class="img">
				<img src={adapters.getPicture(picture)} alt="profile" />
			</div>
		{:else}
			<div class="no-img">
				<div class="profile-default">
					<User size={70} />
				</div>
			</div>
		{/if}
	</div>
	<InputFile bind:files={pictureFiles}>
		<Renew />
		Change picture
	</InputFile>
	<InputField autofocus bind:value={name} label="Display name" />
</Container>
<Container grow justify="flex-end">
	<Button variant="strong" disabled={isCreatingIdentity || !name || saving} on:click={saveProfile}>
		<ArrowRight />
	</Button>
</Container>

<style lang="scss">
	.avatar {
		margin: var(--spacing-12) auto 0;
		border-radius: 100px;
	}
	.no-img,
	.img {
		aspect-ratio: 1;
		height: 140px;
		border-radius: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--color-step-10, var(--color-dark-step-50));
		margin-inline: auto;
		position: relative;

		:global(img) {
			aspect-ratio: 1;
			object-fit: cover;
			border-radius: 100px;
		}
	}

	.profile-default {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;

		:global(svg) {
			fill: var(--color-step-50, var(--color-dark-step-50));
		}
	}
</style>
