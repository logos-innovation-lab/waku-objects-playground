<script lang="ts">
	export let grid: '2' | '3' | '4' | '1-3' | '3-1' | '1-2' | '2-1' = '3-1'
	export let gap = 6
</script>

<div class={`grid grid-${grid}`} style={`gap: ${gap}px`}>
	<slot />
</div>

<style lang="scss">
	.grid {
		display: grid;
	}
	.grid-2 {
		grid-template-columns: repeat(2, 1fr);
	}
	.grid-3 {
		grid-template-columns: repeat(3, 1fr);
	}
	.grid-4 {
		grid-template-columns: repeat(4, 1fr);
	}
	.grid-1-3 {
		grid-template-columns: 1fr 3fr;
	}
	.grid-3-1 {
		grid-template-columns: 3fr 1fr;
	}
	.grid-1-2 {
		grid-template-columns: 1fr 2fr;
	}
	.grid-2-1 {
		grid-template-columns: 2fr 1fr;
	}
</style>
