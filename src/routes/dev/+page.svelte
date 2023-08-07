<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
</script>

<Header title="DEV DASHBOARD" />
<Container>
	<section>
		<div class="label">Network</div>
		<div class="value">{defaultBlockchainNetwork.name}</div>
	</section>
</Container>

<style lang="scss">
	section {
		margin-top: 1rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.label {
		font-family: var(--font-body);
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--color-step-50, var(--color-dark-step-10));
		margin-bottom: var(--spacing-4);
	}

	.value {
		font-family: var(--font-serif);
	}
</style>
