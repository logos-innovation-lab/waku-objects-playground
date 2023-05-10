<script lang="ts">
	import type { ComponentConstructor, IconProps } from '$lib/types'

	export let icon: ComponentConstructor<IconProps> | undefined = undefined
	export let iconStart: ComponentConstructor<IconProps> | undefined = undefined
	export let iconEnd: ComponentConstructor<IconProps> | undefined = undefined
	export let variant: '' | 'icon' | 'strong' = ''
	export let disabled: boolean | undefined = undefined
</script>

<button type="button" {disabled} class={variant} on:click>
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
	:root {
		/* BUTTON */
		--button-bg-color: var(--transparent);
		--button-border-color: var(--gray20);
		--button-content-color: var(--gray50);
		--button-active-bg-color: var(--gray20);
		--button-active-content-color: var(--black);
		--button-disabled-border-color: var(--gray20);
		--button-disabled-content-color: var(--gray30);

		/* ICON BUTTON */
		/* no border, everything else the same */
		--border-color: var(--transparent);

		/* ICON BUTTON STRONG */
		--icon-button-strong-bg-color: var(--gray50);
		--icon-button-content-color: var(--gray10);
		--icon-button-active-bg-color: var(--black);
		--icon-button-active-content-color: var(--white);
		--icon-button-disabled-bg-color: var(--gray30);
		--icon-button-disabled-content-color: var(--gray10);
	}
	button {
		background: var(--transparent);
		border: 1px solid var(--gray20);
		border-radius: 30px;
		color: var(--gray50);
		font-size: var(--font-size-normal);
		font-weight: var(--font-weight-600);
		line-height: 20px;
		margin: 0;
		padding: 14px;
		overflow-wrap: normal;
		cursor: pointer;
		display: flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);

		.wrapper {
			line-height: 0;
			:global(svg) {
				fill: var(--gray50);
				width: 20px;
				height: 20px;
			}
		}

		&:active {
			background-color: var(--gray20);
		}

		&:disabled {
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--gray30);
			}
		}

		&.icon {
			border-color: var(--transparent);

			.wrapper {
				:global(svg) {
					width: 24px;
					height: 24px;
				}
			}
		}

		&.strong {
			background-color: var(--gray50);
			.wrapper {
				:global(svg) {
					fill: var(--gray10);
					width: 24px;
					height: 24px;
				}
			}

			&:active {
				background-color: var(--black);
				.wrapper {
					:global(svg) {
						fill: var(--white);
						width: 24px;
						height: 24px;
					}
				}
			}

			&:disabled {
				background-color: var(--grey-30);
			}
		}

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
		&.border {
			border: 1px solid var(--gray20);
		}
	}
</style>
