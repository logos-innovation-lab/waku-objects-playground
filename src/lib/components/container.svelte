<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
	export let variant: 'space-between' | 'flex-start' | 'center' = 'flex-start'
</script>

<div class={`container ${direction} ${variant}`} style={`gap: ${gap}px`}>
	<slot />
</div>

<style>
	.container {
		display: flex;
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
	.center {
		height: 100%;
	}
	.space-between {
		justify-content: space-between;
	}
	.center {
		justify-content: center;
	}
</style>
