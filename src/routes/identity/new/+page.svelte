<script lang="ts">
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import User from '$lib/components/icons/user.svelte'

	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import Textarea from '$lib/components/textarea.svelte'

	import adapters from '$lib/adapters'
	import { profile } from '$lib/stores/profile'
	import { goto } from '$app/navigation'
	import { clipAndResize } from '$lib/utils/image'
	import routes from '$lib/routes'

	let picture = $profile.avatar
	let name = $profile.name

	$: if ($profile.loading === false && !name && !picture) {
		name = $profile.name
		picture = $profile.avatar
	}
	let saving = false

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
			await adapters.saveUserProfile(name, picture)
			goto(routes.IDENTITY_CONFIRM)
		} catch (error) {
			console.error('failed to save profile: ', error)
		}
		saving = false
	}
</script>

<Header title="Create new identity">
	<Button slot="left" variant="icon" on:click={() => goto(routes.HOME)}>
		<ChevronLeft />
	</Button>
</Header>
{#if $profile.loading}
	<Container align="center" grow gap={6} justify="center">
		<h2>Loading...</h2>
	</Container>
{:else if $profile.error}
	<Container align="center" grow gap={6} justify="center">
		<h2>Failed to load profile: {$profile.error.message}</h2>
	</Container>
{:else}
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
		<Textarea bind:value={name} label="Display name" />
	</Container>
	<Container grow justify="flex-end">
		<Button
			variant="strong"
			disabled={name === '' || name === undefined || saving}
			on:click={saveProfile}
		>
			<ArrowRight />
		</Button>
	</Container>
{/if}

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
