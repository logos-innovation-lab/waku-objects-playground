<script lang="ts">
	export let value = ''
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
</script>

<label>
	{label}
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value on:keydown on:keypress on:keyup {autofocus} {placeholder} rows="1" />
</label>

<style lang="scss">
	label {
		display: flex;
		font-size: var(--font-size-normal);
		padding-block: var(--spacing-24);
		width: 100%;

		textarea {
			width: 100%;
			border: 1px solid var(--color-border);
			// border-radius: 21px;
			padding: var(--spacing-12);
			margin: 0;
			font-size: var(--font-size-normal);
			line-height: 14px;
			min-height: 1px;
			resize: none;
		}
	}
</style>
