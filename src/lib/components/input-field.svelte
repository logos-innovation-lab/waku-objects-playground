<script lang="ts">
	export let value = ''
	export let placeholder: string | undefined = undefined
	export let autofocus = false
	export let disabled = false
	export let pad = 0
	export let label: string | undefined = undefined
</script>

<label>
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
		on:keydown
		on:keypress
		on:keyup
	/>
</label>

<style lang="scss">
	label {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	span {
		margin-inline: 13px;
		text-align: left;
		color: var(--color-step-40);
	}

	input {
		border: 1px solid var(--color-step-20);
		border-radius: var(--border-radius);
		padding: 11px var(--spacing-12);
		max-height: 120px;
		min-height: 48px;
		width: 100%;
		color: var(--color-step-50);

		&:focus {
			outline: none;
			color: var(--color-accent);
		}

		&:disabled {
			background-color: var(--color-step-10);
			border-color: transparent;
		}

		&::placeholder {
			color: rgba(var(--color-step-50-rgb), 0.5);
		}
	}
</style>
