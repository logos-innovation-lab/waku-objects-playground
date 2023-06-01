<script lang="ts">
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import DocumentSigned from '$lib/components/icons/document-signed.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
</script>

<Header title="Create new identity">
	<Button slot="left" variant="icon" on:click={() => history.back()}>
		<ChevronLeft />
	</Button>
</Header>
<Container gap={6} grow justify="center" align="center" pad={24}>
	<p class="text-lg text-bold">How to recover your identity</p>
	<p class="text-lg description">
		If you need to recover your identity, you will need your recovery phrase. Back it up now, or
		later from your identity settings page.
	</p>
	<Button on:click={() => goto(routes.IDENTITY_BACKUP)}>
		<DocumentSigned />
		Backup recovery phrase
	</Button>
</Container>
<Container pad={24}>
	<!-- This goes back 2 pages so that user gets to the page where he started the create wallet flow -->
	<Button variant="strong" on:click={() => history.go(-2)}>
		<Checkmark />
		I understand
	</Button>
</Container>

<style lang="scss">
	.description {
		margin-bottom: calc(var(--spacing-24) - var(--spacing-6));
	}
</style>
