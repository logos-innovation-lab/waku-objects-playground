<script lang="ts">
	export let value = ''
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
	export let pad = 0
	export let nonEditable = false
	export let rows = 1
</script>

<label class="textarea text-sm" style={`padding-block: ${pad}px`}>
	{#if label !== ''}
		<span>{label}</span>
	{/if}
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
		disabled={nonEditable}
		{rows}
	/>
</label>

<style lang="scss">
	label.textarea {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-6);
		width: 100%;
		color: var(--gray40);
		margin-left: -12px;
		margin-right: -12px;
		width: calc(100% + 24px);

		span {
			margin-left: var(--spacing-12);
			text-align: left;
		}

		textarea {
			color: var(--gray50);
			width: 100%;
			border: 1px solid var(--gray20);
			border-radius: var(--border-radius);
			padding: 11px var(--spacing-12);
			margin: 0;
			min-height: 1px;
			resize: none;

			&:disabled {
				background-color: var(--gray10);
				border-color: transparent;
			}

			&:focus {
				color: var(--black);
			}
		}

		::placeholder {
			color: var(--gray40);
		}
	}
</style>
