<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
	export let justify: 'space-between' | 'flex-start' | 'flex-end' | 'center' = 'flex-start'
	export let align: 'left' | 'right' | 'center' | undefined = undefined
</script>

<div class={`container ${direction} ${justify} ${align}`} style={`gap: ${gap}px`}>
	<slot />
</div>

<style>
	.container {
		display: flex;
		justify-content: flex-start;
		padding: 0px var(--spacing-24);
		width: 100%;
	}
	.row {
		flex-direction: row;
	}
	.column {
		flex-direction: column;
	}
	.space-between,
	.stretch,
	.center,
	.flex-end {
		min-height: 100vh;
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
	.left {
		text-align: left;
	}
	.right {
		text-align: right;
	}
	.center {
		text-align: center;
	}
</style>
