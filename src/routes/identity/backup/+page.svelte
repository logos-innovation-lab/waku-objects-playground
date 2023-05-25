<script lang="ts">
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import Close from '$lib/components/icons/close.svelte'
	import Copy from '$lib/components/icons/copy.svelte'
	import Textarea from '$lib/components/textarea.svelte'

	// TODO: get actual seed phrase
	let seed = 'CURRENTLY HARD CODED ----- behave mushroom guard venue soup witness someone'
</script>

<Header title="Backup recovery phrase">
	<Button slot="right" variant="icon" on:click={() => history.back()}>
		<Close />
	</Button>
</Header>
<Container gap={6} grow justify="center" align="center">
	<p class="text-lg text-bold">Keep your recovery phrase safe</p>
	<p class="text-lg description">
		Anyone with your recovery phrase will be able to access your identity and account
	</p>
	<Textarea label="Recovery phrase" rows={4} nonEditable placeholder={seed} />
	<!-- TODO: fix button action -->
	<Button on:click={() => goto(routes.HOME)}>
		<Copy />
		Copy
	</Button>
</Container>

<style lang="scss">
	.description {
		margin-bottom: calc(var(--spacing-24) - var(--spacing-6));
	}
</style>
