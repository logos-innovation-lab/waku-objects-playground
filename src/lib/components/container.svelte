<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
</script>

<div class={`root ${direction}`} style={`gap: ${gap}px`}>
	<slot />
</div>

<style>
	.root {
		display: flex;
		padding: 0px var(--spacing-24);
		width: 100%;
		max-width: 498px;
		margin-inline: auto;
	}
	.row {
		flex-direction: row;
	}
	.column {
		flex-direction: column;
	}
</style>
