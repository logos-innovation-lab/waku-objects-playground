<script lang="ts">
	export let placeholder = ''
	export let label = ''
	export let autofocus = false
	export let value: string | undefined = undefined
</script>

<label>
	{label}
	<!-- svelte-ignore a11y-autofocus -->
	<textarea rows="1" class="text-lg" {autofocus} {placeholder} bind:value />
</label>

<style lang="scss">
	label {
		font-size: var(--font-size-sm);
		color: var(--gray40);
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
