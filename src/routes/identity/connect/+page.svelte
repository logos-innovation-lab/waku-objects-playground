<script lang="ts">
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import Textarea from '$lib/components/textarea.svelte'
	import { walletStore } from '$lib/stores/wallet'

	let phrase = ''
	let restoring = false

	async function restoreWallet() {
		if (!phrase) return
		restoring = true

		try {
			walletStore.restoreWallet(phrase)

			history.back()
		} catch (error) {
			console.error(error)
		}

		restoring = false
	}
</script>

<Header title="Connect your existing identity">
	<Button slot="left" variant="icon" on:click={() => history.back()}>
		<ChevronLeft />
	</Button>
</Header>
<Container gap={6} grow justify="center" align="left">
	<div class="pad">
		<p class="text-lg text-bold">Connect your identity</p>
		<p class="text-lg description">
			You need your recovery phrase in order to connect your identity and account
		</p>
	</div>
	<Textarea
		bind:value={phrase}
		label="Recovery phrase"
		placeholder="Paste or type recovery phrase here..."
		rows={4}
	/>
</Container>
<Container>
	<Button disabled={restoring || !phrase} variant="strong" on:click={restoreWallet}>
		<Checkmark />
		{restoring ? 'Connecting...' : 'Connect identity'}
	</Button>
</Container>

<style lang="scss">
	.description {
		margin-bottom: calc(var(--spacing-24) - var(--spacing-6));
	}
	.pad {
		padding-inline: var(--spacing-12);
	}
</style>
