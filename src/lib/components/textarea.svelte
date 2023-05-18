<script lang="ts">
	export let value = ''
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
	export let pad = 0
	export let nonEditable = false
</script>

<label class="textarea text-sm" style={`padding-block: ${pad}`}>
	<span>{label}</span>
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
		rows="1"
	/>
</label>

<style lang="scss">
	label.textarea {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		width: 100%;
		color: var(--gray40);

		span {
			margin-left: var(--spacing-12);
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
