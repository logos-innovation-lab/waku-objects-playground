<script lang="ts">
	import copy from 'copy-to-clipboard'

	import Close from '$lib/components/icons/close.svelte'
	import Copy from '$lib/components/icons/copy.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import { walletStore } from '$lib/stores/wallet'

	let copied = false

	function copyToClipboard() {
		copy(walletStore.getMnemonics())
		copied = true
	}
</script>

<Header title="Backup recovery phrase">
	<Button slot="right" variant="icon" on:click={() => history.back()}>
		<Close />
	</Button>
</Header>

<AuthenticatedOnly>
	<Container gap={6} grow justify="center" align="center">
		<p class="text-lg text-bold">Keep your recovery phrase safe</p>
		<p class="text-lg description">
			Anyone with your recovery phrase will be able to access your identity and account
		</p>
		<ReadonlyText label="Recovery phrase" overflow={false} marginBottom={0} align="left">
			{walletStore.getMnemonics()}
		</ReadonlyText>
		<Button on:click={copyToClipboard}>
			{#if copied}
				<Checkmark />
				Copied
			{:else}
				<Copy />
				Copy
			{/if}
		</Button>
	</Container>
</AuthenticatedOnly>

<style lang="scss">
	.description {
		margin-bottom: calc(var(--spacing-24) - var(--spacing-6));
	}
</style>
