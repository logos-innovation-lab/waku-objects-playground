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
		background-color: var(--color-base, var(--color-dark-accent));

		&.danger {
			color: red;
		}

		&:hover {
			background-color: var(--color-step-10, var(--color-dark-step-50));
		}

		&.disabled {
			color: rgba(var(--color-step-50-rgb, var(--color-dark-step-10-rgb)), 0.25);
			cursor: not-allowed;
		}

		&:not(:last-child) {
			border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));
		}
	}
</style>
