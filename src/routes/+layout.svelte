<script lang="ts">
	import '@total-typescript/ts-reset'
	import '@fontsource/inter'
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
		background-color: black;
	}

	.wrapper {
		max-height: 915px;
		max-width: 412px;
		flex-grow: 1;
		background-color: white;
	}
</style>
