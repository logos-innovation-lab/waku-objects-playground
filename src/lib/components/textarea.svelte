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
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-400);

		textarea {
			width: 100%;
			border: 1px solid var(--gray20);
			padding: var(--spacing-12);
			margin: 0;
			font-size: var(--font-size-xl);
			font-weight: var(--font-weight-600);
			line-height: var(--font-size-xl);
			min-height: 1px;
			resize: none;
		}
	}
</style>
