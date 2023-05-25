<script lang="ts">
	export let pad = 0
	export let padTop: number | undefined = undefined
	export let padBottom: number | undefined = undefined
</script>

<hr
	style={`margin-block: ${pad}px; ${padTop !== undefined ? 'margin-top: ' + padTop + 'px' : ''} ${
		padBottom !== undefined ? 'margin-bottom: ' + padBottom + 'px' : ''
	}`}
/>

<style lang="scss">
	hr {
		border: none;
		width: 100%;
		height: 1px;
		background-color: var(--gray20);
	}
</style>
