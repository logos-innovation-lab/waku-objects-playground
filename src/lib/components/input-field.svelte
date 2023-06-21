<script lang="ts">
	export let value = ''
	export let placeholder = ''
	export let autofocus = false
	export let disabled = false
	export let pad = 0

	let inputField: HTMLInputElement
</script>

<!-- svelte-ignore a11y-autofocus -->
<input
	class="text-lg"
	style={`padding-block: ${pad}px`}
	type="text"
	{disabled}
	{autofocus}
	{placeholder}
	bind:value
	bind:this={inputField}
	on:keydown
	on:keypress
	on:keyup
/>

<style lang="scss">
	input {
		border: 1px solid var(--gray20);
		border-radius: var(--border-radius);
		padding: 11px var(--spacing-12);
		max-height: 120px;
		min-height: 48px;
		width: 100%;

		&:focus {
			outline: none;
			color: var(--black);
		}

		&:disabled {
			background-color: var(--gray10);
			border-color: transparent;
		}
	}
</style>
