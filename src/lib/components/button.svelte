<script lang="ts">
	import type { ComponentConstructor, IconProps } from '$lib/types'

	export let icon: ComponentConstructor<IconProps> | undefined = undefined
	export let iconStart: ComponentConstructor<IconProps> | undefined = undefined
	export let iconEnd: ComponentConstructor<IconProps> | undefined = undefined
	export let variant: 'rounded' | 'square' | 'nopad' = 'square'
	export let border = true
	export let disabled: boolean | undefined = undefined
	export let large = false
	export let justify: 'left' | 'right' | 'center' = 'center'
</script>

<button
	type="button"
	{disabled}
	class={`${variant} ${justify} ${border ? 'border' : ''} ${large ? 'lg' : ''}`}
	on:click
>
	{#if iconStart !== undefined || icon !== undefined}
		<div class="wrapper">
			<svelte:component this={iconStart || icon} />
		</div>
	{/if}
	<slot />
	{#if iconEnd !== undefined}
		<div class="wrapper">
			<svelte:component this={iconEnd} />
		</div>
	{/if}
</button>

<style lang="scss">
	button {
		background: var(--color-content-bg);
		margin: 0;
		font-size: var(--font-size-button);
		font-weight: var(--font-weight-button);
		cursor: pointer;
		display: flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-12);
		padding: 10px;
		border: none;
		overflow-wrap: normal;

		&.center:not(.nopad) {
			margin-inline: auto;
		}

		&.left {
			margin-left: 0;
			margin-right: auto;
		}

		&.right {
			margin-left: auto;
			margin-right: 0;
		}

		&.lg {
			font-size: var(--font-size-button-lg);
			font-weight: var(--font-weight-button-bold);
		}

		&:disabled {
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--color-border);
			}
		}
		&.square {
			border-radius: 0;
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
