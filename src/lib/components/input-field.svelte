<script lang="ts">
	export let value = ''
	export let placeholder: string | undefined = undefined
	export let autofocus = false
	export let disabled = false
	export let pad = 0
	export let label: string | undefined = undefined

	let inputField: HTMLInputElement
</script>

<div class="input-wrapper">
	{#if label !== undefined && label !== ''}
		<span class="text-sm">{label}</span>
	{/if}
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
</div>

<style lang="scss">
	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	span {
		margin-inline: 13px;
		text-align: left;
		color: var(--gray40);
	}

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
