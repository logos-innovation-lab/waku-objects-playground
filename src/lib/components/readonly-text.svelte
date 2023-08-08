<script lang="ts">
	export let label: string | undefined = undefined
	export let marginBottom = 24
	export let pad = false
	export let align: 'left' | 'right' | 'center' = 'left'
	export let breakWord = false
	export let clickable = false
</script>

<div
	class={`readonly ${pad ? 'pad' : ''}`}
	style={`margin-bottom: ${marginBottom}px; text-align: ${align};`}
>
	{#if label}
		<div class="label">
			{label}
		</div>
	{/if}
	<div class={`main ${breakWord ? 'break' : ''} ${clickable ? 'pointer' : ''}`}>
		<slot />
	</div>
</div>

<style lang="scss">
	.readonly {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);

		&.pad {
			padding-inline: var(--spacing-12);
		}
	}
	.main {
		font-size: var(--font-size-lg);
		padding: var(--spacing-12);
		border-radius: var(--border-radius);
		background-color: var(--color-step-10, var(--color-dark-step-40));

		&.break {
			word-break: break-all;
		}
	}

	.label {
		font-size: var(--font-size-sm);
		margin-left: var(--spacing-12);
		color: var(--color-step-40, var(--color-dark-step-20));
	}

	.pointer {
		cursor: pointer;
	}
</style>
