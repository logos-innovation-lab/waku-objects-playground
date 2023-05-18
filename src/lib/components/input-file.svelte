<script lang="ts">
	// import type { ComponentConstructor, IconProps } from '$lib/types'

	// export let icon: ComponentConstructor<IconProps> | undefined = undefined
	// export let variant: 'rounded' | 'square' | 'nopad' = 'square'
	// export let border = true
	export let disabled: boolean | undefined = undefined
	export let multiple = false
	export let files: FileList | undefined = undefined
</script>

<label class={`input-file`}>
	<!-- {#if icon !== undefined}
		<div class="wrapper">
			<svelte:component this={icon} />
		</div>
	{/if} -->

	<slot />
	<!-- svelte-ignore a11y-missing-attribute -->
	<input type="file" {disabled} bind:files hidden {multiple} />
</label>

<style lang="scss">
	label.input-file {
		background: var(--white);
		border: 1px solid var(--gray20);
		border-radius: var(--border-radius);
		color: var(--gray50);
		font-size: var(--font-size-normal);
		font-weight: var(--font-weight-500);
		line-height: 20px;
		padding: 11px;
		margin: 0 auto var(--spacing-6);
		display: flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);
		cursor: pointer;
		overflow-wrap: normal;

		&:active {
			background-color: var(--gray20);
		}

		&:disabled {
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--gray30);
			}
		}

		// &.square {
		// 	border-radius: 0;
		// 	margin-inline: auto;
		// }
		// &.rounded {
		// 	border-radius: 200px;
		// }
		// &.nopad {
		// 	padding: 0;
		// }
		// &.border {
		// 	border: 1px solid var(--gray20);
		// }
		// .wrapper {
		// 	line-height: 0;
		// }
	}
</style>
