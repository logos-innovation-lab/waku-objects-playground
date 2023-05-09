<script lang="ts">
	import type { ComponentConstructor, IconProps } from '$lib/types'

	export let icon: ComponentConstructor<IconProps> | undefined = undefined
	export let variant: 'rounded' | 'square' | 'nopad' = 'square'
	export let border = true
	export let disabled: boolean | undefined = undefined
	export let multiple = false
	export let files: FileList | undefined = undefined
</script>

<label class={`${variant} ${border ? 'border' : ''}`}>
	{#if icon !== undefined}
		<div class="wrapper">
			<svelte:component this={icon} />
		</div>
	{/if}

	<slot />
	<!-- svelte-ignore a11y-missing-attribute -->
	<input type="file" {disabled} bind:files hidden {multiple} />
</label>

<style lang="scss">
	label {
		background: var(--white);
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
				fill: var(--gray20);
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
			border: 1px solid var(--gray20);
		}
		.wrapper {
			line-height: 0;
		}
	}
</style>
