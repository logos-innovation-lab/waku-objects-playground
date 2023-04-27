<script lang="ts">
	export let value = ''
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
	export let pad = 0
</script>

<label style={`padding-block: ${pad}`}>
	{label}
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value on:keydown on:keypress on:keyup {autofocus} {placeholder} rows="1" />
</label>

<style lang="scss">
	label {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
		font-size: var(--font-size-normal);
		padding-block: var(--spacing-24);
		width: 100%;
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-normal);

		textarea {
			width: 100%;
			border: 1px solid var(--color-border);
			padding: var(--spacing-12);
			margin: 0;
			font-size: var(--font-size-lg);
			font-weight: var(--font-weight-md);
			line-height: var(--font-size-lg);
			min-height: 1px;
			resize: none;
		}
	}
</style>
