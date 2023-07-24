<script lang="ts">
	export let disabled = false
	export let danger = false
	export let onClick: () => unknown
</script>

<li
	class={`${$$props.class} ${disabled ? 'disabled' : ''} ${danger ? 'danger' : ''}`}
	on:click={() => !disabled && onClick()}
	on:keypress={() => !disabled && onClick()}
	role="option"
	tabindex={0}
	aria-selected={false}
	aria-disabled={disabled}
>
	<slot />
</li>

<style lang="scss">
	li {
		padding: 14px;
		list-style: none;
		cursor: pointer;
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-24);
		background-color: var(--white);

		&.danger {
			color: var(--color-red);
		}

		&:hover {
			background-color: var(--ultra-light);
		}

		&.disabled {
			color: rgba(var(--ultra-dark-rgb), 0.25);
			cursor: not-allowed;
		}

		&:not(:last-child) {
			border-bottom: 1px solid var(--light);
		}
	}
</style>
