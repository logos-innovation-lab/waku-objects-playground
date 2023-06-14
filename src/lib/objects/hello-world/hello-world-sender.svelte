<script lang="ts">
	export let name: string | undefined
</script>

<div>
	{#if name}
		Hello from {name}
	{:else}
		Hello World
	{/if}
</div>

<style lang="scss">
</style>
