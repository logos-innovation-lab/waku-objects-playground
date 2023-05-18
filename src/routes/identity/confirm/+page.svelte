<script lang="ts">
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import DocumentSigned from '$lib/components/icons/document-signed.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import adapters from '$lib/adapters'
	import { profile } from '$lib/stores/profile'
	import { goto } from '$app/navigation'
	import { clipAndResize } from '$lib/utils/image'
	import routes from '$lib/routes'

	let picture = $profile.avatar
	let name = $profile.name
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
		} catch (error) {
			console.error('failed to save profile: ', error)
		}
		saving = false
	}
</script>

<Header title="Create new identity">
	<Button slot="left" variant="icon" on:click={() => history.back()}>
		<ChevronLeft />
	</Button>
</Header>
<Container gap={6}>
	<p>How to recover your identity</p>
	<p>
		If you need to recover your identity, you will need your recovery phrase. Back it up now, or
		later from your identity settings page.
	</p>
	<Button on:click={() => goto(routes.HOME)}>
		<DocumentSigned />
		Backup recovery phrase
	</Button>
	<Button on:click={() => goto(routes.HOME)}>
		<Checkmark />
		I understand
	</Button>
</Container>

<style lang="scss">
</style>
