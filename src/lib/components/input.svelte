<script lang="ts">
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
</script>

<label>
	{label}
	<!-- svelte-ignore a11y-autofocus -->
	<input {autofocus} {placeholder} />
</label>

<style lang="scss">
	label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-6);
		font-size: var(--font-size-sm);
		color: var(--color-body-text);
		// padding-block: var(--spacing-24);
		background-color: transparent;
		transition: background-color 0.2s;

		&:focus-within {
			background-color: var(--grey-150);
			transition: background-color 0.2s;
		}
	}
</style>
