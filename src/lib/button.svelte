<script lang="ts">
	import type { ComponentConstructor, IconProps } from '$lib/types'

	export let icon: ComponentConstructor<IconProps> | undefined = undefined
	export let variant: 'rounded' | 'square' = 'square'
	export let border: boolean = true
</script>

<button class={`${variant} ${border ? 'border' : ''}`}>
	{#if icon !== undefined}
		<div class="wrapper">
			<svelte:component this={icon} />
		</div>
	{/if}
	<slot />
</button>

<style>
	button {
		background: var(--color-background);
		margin: 0;
		padding: var(--spacing-12);
		font-size: var(--font-size-button);
		font-weight: var(--font-weight-button);
		cursor: pointer;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-12);
		border: none;
	}
	.square {
		border-radius: 0;
	}
	.rounded {
		border-radius: 200px;
	}
	.border {
		border: 1px solid var(--color-border);
	}
</style>
