<script lang="ts">
	export let direction: 'row' | 'column' = 'column'
	export let gap = 0
	export let justify: 'space-between' | 'flex-start' | 'flex-end' | 'center' = 'flex-start'
	export let fullheight: boolean | undefined = undefined
	export let align: 'left' | 'right' | 'center' | undefined = undefined
</script>

<div
	class={`container text-${align} ${direction} ${justify} ${fullheight ? 'fullheight' : ''}`}
	style={`gap: ${gap}px`}
>
	<slot />
</div>

<style lang="scss">
	.container {
		display: flex;
		justify-content: flex-start;
		padding: 0px var(--spacing-12);
		width: 100%;
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
	}
	.text-right {
		text-align: right;
	}
	.text-center {
		text-align: center;
	}
	.fullheight {
		min-height: 100dvh;
		min-height: 100vh;
	}
</style>
