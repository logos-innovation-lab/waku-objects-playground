<script lang="ts">
	import CaretDown from './icons/caret-sort.svelte'

	let cls: string | undefined = undefined
	export { cls as class }
	export let label: string
	export let value: string
	export let disabled: boolean | undefined = undefined
</script>

<div
	class={`root ${cls} ${disabled ? 'disabled' : ''}`}
	on:click
	on:keypress
	role="menu"
	tabindex={0}
>
	<div class="label">
		{label}
	</div>
	<div class="value">
		<div>{value}</div>
		<CaretDown />
	</div>
</div>

<style lang="scss">
	.root {
		padding: var(--spacing-24);
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		font-family: var(--font-body);
		font-weight: 600;
		font-size: var(--font-size-normal);
		white-space: nowrap;
		color: var(--color-body-text);
		margin: var(--spacing-24) calc(var(--spacing-24) * -1) var(--spacing-12);

		.label {
			font-size: var(--font-size-sm);
			color: var(--grey-500);
			margin-bottom: var(--spacing-4);
		}

		.value {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			font-family: var(--font-serif);
		}

		& :global(svg) {
			fill: var(--color-body-text);
		}

		&:disabled {
			color: var(--grey-200);
			cursor: not-allowed;

			& :global(svg) {
				fill: var(--grey-200);
			}
		}

		&:active:not(:disabled),
		&:hover:not(:disabled) {
			background-color: var(--grey-150);
			transition: background-color 0.2s;
		}
	}
</style>
