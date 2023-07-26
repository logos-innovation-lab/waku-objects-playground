<script lang="ts">
	export let label: string | undefined = undefined
	export let marginBottom = 24
	export let overflow = true
	export let align: 'left' | 'right' | 'center' = 'left'
	export let breakWord = false
</script>

<div
	class={`readonly ${overflow ? 'overflow' : ''}`}
	style={`margin-bottom: ${marginBottom}px; text-align: ${align};`}
>
	{#if label}
		<div class="label">
			{label}
		</div>
	{/if}
	<div class={`main ${breakWord ? 'break' : ''}`}>
		<slot />
	</div>
</div>

<style lang="scss">
	.readonly {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);

		&.overflow {
			width: calc(100% + var(--spacing-24));
			margin-left: calc(-1 * var(--spacing-12));
			margin-right: calc(-1 * var(--spacing-12));
		}
	}
	.main {
		background-color: var(--color-step-10);
		padding: var(--spacing-12);
		border-radius: var(--border-radius);
		font-size: var(--font-size-lg);

		&.break {
			word-break: break-all;
		}
	}

	.label {
		font-size: var(--font-size-sm);
		color: var(--color-step-40);
		margin-left: var(--spacing-12);
	}
</style>
