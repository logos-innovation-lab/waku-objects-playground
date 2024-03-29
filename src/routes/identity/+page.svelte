<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		Renew,
		Wallet,
		SettingsView,
		SettingsAdjust,
		Logout,
		DocumentSigned,
		DataBlob,
	} from 'carbon-icons-svelte'

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
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import Avatar from '$lib/components/avatar.svelte'
	import { errorStore } from '$lib/stores/error'

	let avatar = $profile.avatar
	let name = $profile.name

	$: if ($profile.loading === false && !name && !avatar) {
		name = $profile.name
		avatar = $profile.avatar
	}

	let files: FileList | undefined = undefined
	async function resizePersonaPicture(p?: File) {
		try {
			avatar = p ? await uploadPicture(await clipAndResize(p, 200, 200)) : avatar
		} catch (error) {
			errorStore.addEnd({
				title: 'Upload error',
				message: `Failed to upload picture. Try another picture or refresh the page. ${
					(error as Error).message
				}`,
				ok: true,
			})
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

	async function saveProfileNow() {
		const wallet = get(walletStore).wallet
		if (!wallet) {
			errorStore.addEnd({
				title: 'No wallet',
				message: `Failed to retrieve wallet.`,
				reload: true,
			})
			return
		}
		try {
			await adapters.saveUserProfile(wallet, name, avatar)
		} catch (error) {
			errorStore.addEnd({
				title: 'Connection error',
				message: `Failed to save profile. ${(error as Error).message}`,
				ok: true,
				retry: () => saveProfileNow(),
			})
		}
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

<Layout>
	<svelte:fragment slot="header">
		<Header title="Identity">
			<Button slot="left" variant="icon" on:click={() => goto(routes.HOME)}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<AuthenticatedOnly let:wallet>
		<Container gap={6}>
			<Avatar picture={avatar} seed={wallet.signingKey.compressedPublicKey} size={140} />
			<InputFile bind:files>
				<Renew />
				Change picture
			</InputFile>
			<div class="displayname">
				<InputField bind:value={name} label="Display name" />
			</div>
		</Container>
		<ButtonBlock borderTop on:click={() => goto(routes.IDENTITY_ACCOUNT)}>
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
		<ButtonBlock borderTop on:click={() => goto(routes.IDENTITY_CHAT)}>
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
		<ButtonBlock borderTop on:click={() => goto(routes.IDENTITY_PREFERENCES)}>
			<Container direction="row" justify="space-between" align="center" alignItems="center">
				<div class="icon">
					<SettingsAdjust size={20} /> Preferences
				</div>
				<div>
					<Button variant="icon">
						<ChevronRight />
					</Button>
				</div>
			</Container>
		</ButtonBlock>
		<ButtonBlock borderTop borderBottom on:click={() => goto(routes.SETTINGS_OBJECTS)}>
			<Container direction="row" justify="space-between" align="center" alignItems="center">
				<div class="icon">
					<DataBlob size={20} /> Waku Objects
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
	</AuthenticatedOnly>
</Layout>

<style lang="scss">
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
