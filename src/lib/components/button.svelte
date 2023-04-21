<script lang="ts">
	import type { ComponentConstructor, IconProps } from '$lib/types'

	export let icon: ComponentConstructor<IconProps> | undefined = undefined
	export let variant: 'rounded' | 'square' | 'nopad' = 'square'
	export let border = true
	export let disabled: boolean | undefined = undefined
</script>

<button type="button" {disabled} class={`${variant} ${border ? 'border' : ''}`} on:click>
	{#if icon !== undefined}
		<div class="wrapper">
			<svelte:component this={icon} />
		</div>
	{/if}
	<slot />
</button>

<style lang="scss">
	button {
		background: var(--color-background);
		margin: 0;
		font-size: var(--font-size-button);
		font-weight: var(--font-weight-button);
		cursor: pointer;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-12);
		padding: 10px;
		border: none;

		&:disabled {
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--color-border);
			}
		}
		&.square {
			border-radius: 0;
			margin-inline: auto;
		}
		&.rounded {
			border-radius: 200px;
		}
		&.nopad {
			padding: 0;
		}
		&.border {
			border: 1px solid var(--color-border);
		}
		.wrapper {
			line-height: 0;
		}
	}
</style>
