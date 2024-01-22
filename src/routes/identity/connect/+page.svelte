<script lang="ts">
	import { Checkmark, ChevronLeft } from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import Textarea from '$lib/components/textarea.svelte'
	import { walletStore } from '$lib/stores/wallet'
	import Layout from '$lib/components/layout.svelte'
	import { errorStore } from '$lib/stores/error'

	let phrase = ''
	let restoring = false

	async function restoreWallet() {
		if (!phrase) return
		restoring = true

		try {
			const trimmedPhrase = phrase.trim()
			walletStore.restoreWallet(trimmedPhrase)

			history.back()
		} catch (error) {
			errorStore.addEnd({
				title: 'Wallet error',
				message: `Failed to restore wallet. ${(error as Error)?.message}`,
				ok: true,
				retry: restoreWallet,
			})
		}

		restoring = false
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Connect your existing identity">
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={6} justify="center" align="left">
		<div class="pad">
			<p class="text-lg text-bold">Connect your identity</p>
			<p class="text-lg description">
				You need your recovery phrase in order to connect your identity and account
			</p>
		</div>
		<Textarea
			autofocus
			bind:value={phrase}
			label="Recovery phrase"
			placeholder="Paste or type recovery phrase here..."
			height={120}
		/>
	</Container>
	<Container>
		<Button disabled={restoring || !phrase} variant="strong" on:click={restoreWallet}>
			<Checkmark />
			{restoring ? 'Connecting...' : 'Connect identity'}
		</Button>
	</Container>
</Layout>

<style lang="scss">
	.description {
		margin-bottom: calc(var(--spacing-24) - var(--spacing-6));
	}
	.pad {
		padding-inline: var(--spacing-12);
	}
</style>
