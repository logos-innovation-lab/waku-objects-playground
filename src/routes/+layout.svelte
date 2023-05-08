<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/source-sans-pro' // Defaults to weight 400 with all styles included.
	import '@fontsource/source-sans-pro/600.css'
	import '@fontsource/source-sans-pro/700.css'
	import './styles.css'
	import { onMount } from 'svelte'
	import { onDestroy } from 'svelte'
	import adapter from '$lib/adapters'

	onMount(() => {
		if (typeof adapter.start === 'function') adapter.start()
	})

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
		background-color: var(--color-wrapper-bg);
		/* padding: 0 var(--spacing-24); */
	}

	.wrapper {
		/* max-height: calc(100vh - var(--spacing-24)); */
		max-width: 412px;
		width: 100%;
		height: 100%;
		background-color: white;
		/* padding-bottom: var(--spacing-24); */
		/* overflow: auto; */
		position: relative;
	}
</style>
