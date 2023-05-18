<script lang="ts">
	export let variant: '' | 'icon' | 'strong' | 'account' = ''
	export let disabled: boolean | undefined = undefined
</script>

<button type="button" {disabled} class={variant} on:click>
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
		border: 1px solid var(--gray20);
		border-radius: var(--border-radius);
		color: var(--gray50);
		font-size: var(--font-size-normal);
		font-weight: var(--font-weight-500);
		line-height: 20px;
		margin: 0;
		padding: 11px;
		overflow-wrap: normal;
		cursor: pointer;
		display: flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);
		margin-inline: auto;

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

			:global(svg) {
				width: 24px;
				height: 24px;
			}
		}

		&.strong {
			background-color: var(--gray50);
			:global(svg) {
				fill: var(--gray10);
				width: 24px;
				height: 24px;
			}

			&:active {
				background-color: var(--black);
				:global(svg) {
					fill: var(--white);
					width: 24px;
					height: 24px;
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
