<script lang="ts">
	export let disabled: boolean | undefined = undefined
	export let multiple = false
	export let files: FileList | undefined = undefined
</script>

<label class={`input-file`}>
	<slot />
	<input type="file" {disabled} bind:files hidden {multiple} />
</label>

<style lang="scss">
	label.input-file {
		background: var(--color-base);
		border: 1px solid var(--color-step-20, var(--color-dark-step-40));
		border-radius: var(--border-radius);
		color: var(--color-step-50, var(--color-dark-step-10));
		font-size: var(--font-size-normal);
		font-weight: var(--font-weight-500);
		line-height: 20px;
		padding: 11px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);
		cursor: pointer;
		overflow-wrap: normal;

		&:active {
			background-color: var(--color-step-20, var(--color-dark-step-40));
		}

		&:disabled {
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--color-step-30), var(--color-dark-step-30);
			}
		}
	}
</style>
