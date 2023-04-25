<script lang="ts">
	export let disabled = false
	export let danger = false
	export let onClick: () => unknown
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	class={`${$$props.class} ${disabled ? 'disabled' : ''} ${danger ? 'danger' : ''}`}
	on:click={() => !disabled && onClick()}
>
	<slot />
</li>

<style lang="scss">
	li {
		padding: var(--spacing-12);
		list-style: none;
		cursor: pointer;
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-24);
		font-family: var(--font-serif);
		font-size: var(--font-size-normal);
		background-color: var(--color-content-bg);
		border: 1px solid var(--color-border);

		&.danger {
			color: var(--color-red);
		}

		&:hover {
			background-color: var(--color-grey-bg);
		}

		&.disabled {
			color: var(--grey-200);
			cursor: not-allowed;
		}

		&:not(:last-child) {
			border-bottom: 1px solid var(--grey-200);
		}
	}
</style>
