<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/source-sans-pro' // Defaults to weight 400 with all styles included.
	import '@fontsource/source-sans-pro/600.css'
	import '@fontsource/source-sans-pro/700.css'
	import './styles.css'

	import { onDestroy } from 'svelte'
	import adapter from '$lib/adapters'

	onDestroy(() => {
		if (typeof adapter.stop === 'function') adapter.stop()
	})
</script>

<div class="root">
	<div class="wrapper">
		<slot />
	</div>
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		height: 100dvh;
		width: 100vw;
		background-color: var(--black);
	}

	.wrapper {
		max-width: 412px;
		width: 100%;
		height: 100%;
		background-color: white;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}
</style>
