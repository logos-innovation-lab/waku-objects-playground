<script lang="ts">
	export let value = ''
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
	export let pad = 0
</script>

<label style={`padding-block: ${pad}`}>
	{label}
	<!-- TODO: allow textarea height to increase according to entered text -->
	<!-- svelte-ignore a11y-autofocus -->
	<textarea
		class="text-lg"
		bind:value
		on:keydown
		on:keypress
		on:keyup
		{autofocus}
		{placeholder}
		rows="1"
	/>
</label>

<style lang="scss">
	label {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
		font-size: var(--font-size-normal);
		width: 100%;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-400);

		textarea {
			color: var(--black);
			width: 100%;
			border: 1px solid var(--gray20);
			border-radius: var(--border-radius);
			padding: 11px var(--spacing-12);
			margin: 0;
			min-height: 1px;
			resize: none;
		}

		::placeholder {
			color: var(--gray40);
		}
	}
</style>
