<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
	export let justify: 'space-between' | 'flex-start' | 'flex-end' | 'center' = 'flex-start'
	export let align: 'left' | 'right' | 'center' | undefined = undefined
	export let grow: boolean | undefined = undefined
	export let sticky: 'top' | 'bottom' | 'none' = 'none'
</script>

<div
	class={`container text-${align} ${direction} ${justify} sticky-${sticky} ${grow ? 'grow' : ''}`}
	style={`gap: ${gap}px`}
>
	<slot />
</div>

<style lang="scss">
	.container {
		display: flex;
		justify-content: flex-start;
		padding: var(--spacing-12);
		width: 100%;
		flex-grow: 0;
	}

	.sticky-top,
	.sticky-bottom {
		position: sticky;
		height: auto;
		background-color: var(--white);
		z-index: 100;
	}

	.sticky-top {
		border-bottom: var(--border);
		top: 0;
	}

	.sticky-bottom {
		border-top: var(--border);
		bottom: 0;
	}

	.row {
		flex-direction: row;
	}
	.column {
		flex-direction: column;
	}

	.space-between {
		justify-content: space-between;
	}
	.center {
		justify-content: center;
	}
	.flex-start {
		justify-content: flex-start;
	}
	.flex-end {
		justify-content: flex-end;
	}
	.text-left {
		text-align: left;
		align-items: left;
	}
	.text-right {
		text-align: right;
		align-items: right;
	}
	.text-center {
		text-align: center;
		align-items: center;
	}
	.grow {
		flex-grow: 1;
		overflow-y: auto;
	}
</style>
