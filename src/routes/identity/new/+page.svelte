<script lang="ts">
	// import Wallet from '$lib/components/icons/wallet.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import Image from '$lib/components/icons/image.svelte'
	import Login from '$lib/components/icons/login.svelte'
	import User from '$lib/components/icons/user.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Textarea from '$lib/components/textarea.svelte'

	import adapters from '$lib/adapters'
	import { profile } from '$lib/stores/profile'
	import { formatAddress } from '$lib/utils/format'
	import { goto } from '$app/navigation'
	import { clipAndResize } from '$lib/utils/image'

	let picture = $profile.avatar
	let name = $profile.name

	let pictureFiles: FileList | undefined = undefined
	async function resizePersonaPicture(p?: File) {
		try {
			picture = p ? await adapters.uploadPicture(await clipAndResize(p, 200, 200)) : picture
		} catch (error) {
			console.error(error)
		}
	}
	$: resizePersonaPicture(pictureFiles && pictureFiles[0])
</script>

<Header title="Create new identity">
	<Button slot="left" variant="icon" on:click={() => goto('/')}>
		<ChevronLeft />
	</Button>
</Header>
<Container gap={6}>
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
		{#if picture}
			<Renew />
			Change picture
		{:else}
			<Image />
			Add picture
		{/if}
	</InputFile>
	<Textarea
		bind:value={name}
		placeholder={formatAddress($profile.address || '')}
		label="Display name"
	/>
</Container>

<style lang="scss">
	.avatar {
		margin: var(--spacing-12) 0px;
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
		background-color: #c9c9c9;
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
	}
</style>
