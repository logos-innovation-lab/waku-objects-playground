<script lang="ts">
	import { Checkmark, ChevronLeft, DocumentSigned } from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import Layout from '$lib/components/layout.svelte'
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Create new identity">
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={6} justify="center" align="center" padX={24}>
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
	<svelte:fragment slot="footer">
		<Container padX={24}>
			<!-- This goes back 2 pages so that user gets to the page where he started the create wallet flow -->
			<Button variant="strong" on:click={() => history.go(-2)}>
				<Checkmark />
				I understand
			</Button>
		</Container>
	</svelte:fragment>
</Layout>

<style lang="scss">
	.description {
		margin-bottom: calc(var(--spacing-24) - var(--spacing-6));
	}
</style>
