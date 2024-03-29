<script lang="ts">
	export let variant: '' | 'icon' | 'strong' | 'account' = ''
	export let disabled: boolean | undefined = undefined
	export let align: 'center' | 'left' | 'right' | 'block' = 'center'
	export let grow = false
</script>

<button type="button" {disabled} class={`${variant} ${align} ${grow ? 'grow' : ''}`} on:click>
	{#if variant === 'account'}
		<div class="avatar">
			<slot name="avatar" />
		</div>
	{/if}
	<slot />
</button>

<style lang="scss">
	button {
		background: var(--transparent);
		border: 1px solid var(--color-step-20, var(--color-dark-step-40));
		border-radius: var(--border-radius);
		color: var(--color-step-50, var(--color-dark-step-10));
		font-size: var(--font-size-normal);
		font-weight: var(--font-weight-500);
		line-height: 1.25;
		padding: 13px;
		overflow-wrap: normal;
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		margin-block: 0;
		gap: var(--spacing-6);
		white-space: nowrap;

		&.block {
			margin: 0;
		}

		&.center {
			margin-inline: auto;
		}

		&.left {
			margin-left: 0;
		}

		&.right {
			margin-right: 0;
		}

		&.grow {
			width: 100%;
			justify-content: space-between;
		}

		&:active {
			background-color: var(--color-step-20, var(--color-dark-step-40));
		}

		&:disabled {
			cursor: not-allowed;
			color: var(--color-step-30, var(--color-dark-step-30));

			& :global(svg) {
				fill: var(--color-step-30, var(--color-dark-step-30));
			}
		}

		&.icon {
			border-color: var(--transparent);

			:global(svg) {
				width: 20px;
				height: 20px;
			}
		}

		&.strong {
			background-color: var(--color-step-50, var(--color-dark-step-10));
			color: var(--color-step-10, var(--color-dark-step-50));

			:global(svg) {
				fill: var(--color-step-10, var(--color-dark-step-50));
				width: 20px;
				height: 20px;
			}

			&:active {
				background-color: var(--color-accent, var(--color-dark-base));
				:global(svg) {
					fill: var(--color-base, var(--color-dark-accent));
					width: 20px;
					height: 20px;
				}
			}

			&:disabled {
				background-color: rgba(var(--color-step-50-rgb, var(--color-dark-step-10-rgb)), 0.25);
			}
		}

		&.center {
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
			border: 1px solid var(--color-step-20, var(--color-dark-step-40));
		}

		&.account {
			padding-left: 64px;
			position: relative;
			height: 48px;

			.avatar {
				position: absolute;
				inset: 0 auto 0 0;
				border-radius: var(--border-radius);
				overflow: hidden;

				:global(img) {
					width: 48px;
					height: 48px;
				}
			}
		}
	}
</style>
