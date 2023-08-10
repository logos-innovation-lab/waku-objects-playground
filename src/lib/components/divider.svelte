<script lang="ts">
	export let pad = 0
	export let padTop: number | undefined = undefined
	export let padBottom: number | undefined = undefined
</script>

<div
	style={`margin-block: ${pad}px; ${padTop !== undefined ? 'margin-top: ' + padTop + 'px' : ''} ${
		padBottom !== undefined ? 'margin-bottom: ' + padBottom + 'px' : ''
	}`}
/>

<style lang="scss">
	div {
		height: 1px;
		background-color: var(--color-step-20, var(--color-dark-step-40));
		flex-shrink: 0;
	}
</style>
