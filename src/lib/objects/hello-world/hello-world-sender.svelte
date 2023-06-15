<script lang="ts">
	export let instanceId: string
	export let name: string | undefined
</script>

{#if name}
	{instanceId}: Hello from {name}
{:else}
	{instanceId}: Hello World
{/if}

<style lang="scss">
</style>
