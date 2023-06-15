<script lang="ts">
	import Button from '$lib/components/button.svelte'

	export let instanceId: string
	export let name: string | undefined
	export let ownName: string
	export let send: (data: unknown) => Promise<void>
	export let updateStore: (updater: (state: unknown) => unknown) => void

	async function sendName() {
		updateStore(() => ({ name: ownName }))
		await send({ name: ownName })
	}
</script>

{#if name}
	{instanceId}: Sent 'Hello from {name}'
{:else}
	<Button variant="strong" on:click={sendName}>{instanceId}: Send Hello from {ownName}!</Button>
{/if}

<style lang="scss">
</style>
