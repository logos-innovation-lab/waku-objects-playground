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
		color: var(--color-step-40, var(--color-dark-step-20));
	}

	input {
		border: 1px solid var(--color-step-20, var(--color-dark-step-40));
		border-radius: var(--border-radius);
		padding: 11px var(--spacing-12);
		max-height: 120px;
		min-height: 48px;
		width: 100%;
		color: var(--color-step-50, var(--color-dark-step-10));
		background-color: var(--color-base, var(--color-dark-accent));

		&:focus {
			outline: none;
			color: var(--color-accent, var(--color-dark-base));
		}

		&:disabled {
			background-color: var(--color-step-10, var(--color-dark-step-50));
			border-color: transparent;
		}

		&::placeholder {
			color: rgba(var(--color-step-50-rgb, var(--color-dark-step-10-rgb)), 0.5);
		}
	}
</style>
