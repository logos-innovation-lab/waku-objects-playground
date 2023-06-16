<script lang="ts">
	import Button from '$lib/components/button.svelte'

	export let name: string | undefined
	export let ownName: string
	export let send: (data: unknown) => Promise<void>

	async function sendName() {
		await send({ name: ownName })
	}
</script>

{#if name}
	Sent 'Hello from {name}'
{:else}
	<Button variant="strong" on:click={sendName}>Send Hello!</Button>
{/if}

<style lang="scss">
</style>
