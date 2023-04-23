<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
</script>

<div class={`container ${direction}`} style={`gap: ${gap}px`}>
	<slot />
</div>

<style>
	.container {
		display: flex;
		padding: 0px var(--spacing-24);
		width: 100%;
		height: 100%;
		flex-grow: 1;
	}
	.row {
		flex-direction: row;
	}
	.column {
		flex-direction: column;
	}
</style>
