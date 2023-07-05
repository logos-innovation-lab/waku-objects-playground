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
		background: var(--white);
		border: 1px solid var(--gray20);
		border-radius: var(--border-radius);
		color: var(--gray50);
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
			background-color: var(--gray20);
		}

		&:disabled {
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--gray30);
			}
		}
	}
</style>
