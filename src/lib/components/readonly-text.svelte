<script lang="ts">
	export let label: string | undefined = undefined
	export let marginBottom = 24
	export let overflow = true
</script>

<div class={`readonly`} style={`margin-bottom: ${marginBottom}px;`}>
	{#if label}
		<div class="label">
			{label}
		</div>
	{/if}
	<div class={`main ${overflow ? 'overflow' : ''}`}>
		<slot />
	</div>
</div>

<style lang="scss">
	.readonly {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}
	.main {
		background-color: var(--gray10);
		padding: var(--spacing-12);
		border-radius: var(--border-radius);

		&.overflow {
			width: calc(100% + var(--spacing-24));
			margin-left: calc(-1 * var(--spacing-12));
			margin-right: calc(-1 * var(--spacing-12));
		}
	}

	.label {
		font-size: var(--font-size-sm);
		color: var(--gray40);
	}
</style>
