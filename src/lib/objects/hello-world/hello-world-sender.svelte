<script lang="ts">
	export let name: string | undefined
</script>

{#if name}
	Hello from {name}
{:else}
	Hello World
{/if}

<style lang="scss">
</style>
