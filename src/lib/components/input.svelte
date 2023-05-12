<script lang="ts">
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
</script>

<label>
	{label}
	<!-- svelte-ignore a11y-autofocus -->
	<textarea rows="1" class="text-lg" {autofocus} {placeholder} />
</label>

<style lang="scss">
	label {
		font-size: var(--font-size-sm);
		color: var(--gray40);
		// display: flex;
		// flex-direction: column;
		// align-items: flex-start;
		// gap: var(--spacing-6);
		// padding-block: var(--spacing-24);
		// transition: background-color 0.2s;

		// &:focus-within {
		// 	background-color: var(--grey-150);
		// 	transition: background-color 0.2s;
		// }
	}
	textarea {
		width: 100%;
		background-color: var(--white);
		border-radius: var(--border-radius);
		border: 1px solid var(--gray20);
		padding: var(--spacing-12);
		color: var(--gray50);
		resize: none;

		&::placeholder {
			color: var(--gray40);
			font-size: var(--font-size-lg);
		}

		&:disabled {
			background-color: var(--gray10);
			color: var(--gray50);
			border-color: var(--transparent);
		}
	}
</style>
