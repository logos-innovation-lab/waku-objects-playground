<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ChevronRight from '$lib/components/icons/chevron-right.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import Wallet from '$lib/components/icons/wallet.svelte'
	import SettingsView from '$lib/components/icons/settings-view.svelte'
	import User from '$lib/components/icons/user.svelte'
	import Logout from '$lib/components/icons/logout.svelte'
	import DocumentSigned from '$lib/components/icons/document-signed.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ButtonBlock from '$lib/components/button-block.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import InputField from '$lib/components/input-field.svelte'
	import Spacer from '$lib/components/spacer.svelte'

	import adapters from '$lib/adapters'
	import { profile } from '$lib/stores/profile'
	import { goto } from '$app/navigation'
	import { clipAndResize } from '$lib/utils/image'
	import routes from '$lib/routes'
	import { onDestroy } from 'svelte'
	import { walletStore } from '$lib/stores/wallet'
	import { get } from 'svelte/store'

	let avatar = $profile.avatar
	let name = $profile.name

	$: if ($profile.loading === false && !name && !avatar) {
		name = $profile.name
		avatar = $profile.avatar
	}

	let files: FileList | undefined = undefined
	async function resizePersonaPicture(p?: File) {
		try {
			avatar = p ? await adapters.uploadPicture(await clipAndResize(p, 200, 200)) : avatar
		} catch (error) {
			console.error(error)
		}
	}
	$: resizePersonaPicture(files && files[0])

	// Whenever profile name or avatar changes, save it
	$: if (
		!$profile.loading &&
		((name && name !== $profile.name) || (avatar && avatar !== $profile.avatar))
	) {
		debounceSaveProfile()
	}
	let timer: ReturnType<typeof setTimeout> | undefined

	function saveProfileNow() {
		const wallet = get(walletStore).wallet
		if (!wallet) return console.error('no wallet')
		adapters.saveUserProfile(wallet.address, name, avatar)
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
</script>

<Header title="Identity">
	<Button slot="left" variant="icon" on:click={() => goto(routes.HOME)}>
		<ChevronLeft />
	</Button>
</Header>
{#if $profile.loading}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $profile.error}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Failed to load profile: {$profile.error.message}</h2>
	</Container>
{:else}
	<Container gap={6}>
		<div class="avatar">
			{#if avatar}
				<div class="img">
					<img src={adapters.getPicture(avatar)} alt="your avatar" />
				</div>
			{:else}
				<div class="no-img">
					<div class="profile-default">
						<User size={70} />
					</div>
				</div>
			{/if}
		</div>
		<InputFile bind:files>
			<Renew />
			Change picture
		</InputFile>
		<div class="displayname">
			<InputField bind:value={name} label="Display name" />
		</div>
	</Container>
	<ButtonBlock borderTop borderBottom on:click={() => goto(routes.IDENTITY_ACCOUNT)}>
		<Container direction="row" justify="space-between" align="center" alignItems="center">
			<div class="icon">
				<Wallet size={20} /> Account
			</div>
			<div>
				<Button variant="icon">
					<ChevronRight />
				</Button>
			</div>
		</Container>
	</ButtonBlock>
	<ButtonBlock borderTop borderBottom on:click={() => goto(routes.IDENTITY_CHAT)}>
		<Container direction="row" justify="space-between" align="center" alignItems="center">
			<div class="icon">
				<SettingsView size={20} /> Chat appearance
			</div>
			<div>
				<Button variant="icon">
					<ChevronRight />
				</Button>
			</div>
		</Container>
	</ButtonBlock>
	<Container align="center" gap={12} padX={24} padY={24}>
		<p>
			If you disconnect or need to recover access to your identity you will need your recovery
			phrase
		</p>
	</Container>
	<Container align="center" gap={12} padX={24} padY={0}>
		<Button on:click={() => goto(routes.IDENTITY_BACKUP)}>
			<DocumentSigned />
			Backup recovery phrase
		</Button>
		<Button
			on:click={async () => {
				walletStore.disconnectWallet()
				goto(routes.HOME)
			}}
		>
			<Logout />
			Disconnect identity from device
		</Button>
	</Container>
	<Spacer />
{/if}

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
	}

	.displayname {
		margin-top: var(--spacing-6);
		margin-bottom: var(--spacing-12);
	}

	.icon {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: var(--spacing-12);
		padding-left: var(--spacing-12);
	}
</style>
