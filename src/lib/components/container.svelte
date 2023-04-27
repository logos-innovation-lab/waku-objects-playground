<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
	export let justify: 'space-between' | 'flex-start' | 'flex-end' | 'center' = 'flex-start'
</script>

<div class={`container ${direction} ${justify}`} style={`gap: ${gap}px`}>
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
	.flex-end,
	.flex-start {
		height: 100%;
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
</style>
