<script lang="ts">
	import Wallet from '$lib/components/icons/wallet.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import Image from '$lib/components/icons/image.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { profile } from '$lib/stores/profile'
	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import InputFile from '$lib/components/input-file.svelte'
	import { clipAndResize } from '$lib/utils/image'
	import Textarea from '$lib/components/textarea.svelte'

	$: picture = $profile.avatar
	$: name = $profile.name

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

<Container gap={12}>
	<Header title="Profile">
		<Button
			slot="left"
			icon={ArrowLeft}
			border={false}
			variant="nopad"
			on:click={() => goto('/')}
		/>
	</Header>

	<div class="mid">
		{#if !$profile.address}
			<h2>Connect your wallet</h2>
			<p>To use Waku Objects, you need to access your account by connecting your wallet.</p>
			<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
		{:else if $profile.loading}
			<h2>Loading...</h2>
		{:else if $profile.error}
			<h2>Failed to load profile: {$profile.error.message}</h2>
		{:else}
			<h2>Your account</h2>
			<div class="avatar">
				{#if picture}
					<div class="img">
						<img src={adapters.getPicture(picture)} alt="profile" />
						<div class="change">
							<InputFile variant="rounded" icon={Renew} bind:files={pictureFiles} />
						</div>
					</div>
				{:else}
					<div class="no-img">
						<div class="empty">
							<InputFile icon={Image} bind:files={pictureFiles}>Add profile</InputFile>
						</div>
					</div>
				{/if}
			</div>
			<Textarea bind:value={name} placeholder="Name" />
			<div class="wallet-info">
				<h2>Wallet address</h2>
				<div class="wallet-info-wrapper">
					{$profile.address}
				</div>
			</div>
			<div class="row">
				<Button
					disabled={$profile.avatar === picture && $profile.name === name}
					on:click={() => {
						adapters.saveUserProfile(name, picture)
					}}>Save</Button
				>
				<Button on:click={() => adapters.logOut()}>Log out</Button>
			</div>
		{/if}
	</div>
</Container>

<style lang="scss">
	.mid {
		flex-grow: 1;
	}

	.row {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-12);
	}

	.avatar {
		margin: var(--spacing-12) 0px;
		border-radius: 100px;

		.no-img,
		.img {
			aspect-ratio: 1;
			height: 200px;
			border-radius: 100px;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #c9c9c9;
			margin-inline: auto;
			position: relative;

			img {
				aspect-ratio: 1;
				object-fit: cover;
				border-radius: 100px;
			}
		}

		.empty,
		.change {
			position: absolute;
			inset: auto var(--spacing-12) var(--spacing-12) auto;
			transform: none;
			width: max-content;
			height: fit-content;
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 10;
		}
	}

	.wallet-info {
		padding-block: var(--spacing-48);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
	}

	.wallet-info-wrapper {
		background-color: var(--grey-150);
		display: block;
		padding: var(--spacing-12);
		font-family: var(--font-mono);
		word-break: break-all;
	}
</style>
