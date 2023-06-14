<script lang="ts">
	import { page } from '$app/stores'
	import adapter from '$lib/adapters'
	import Button from '$lib/components/button.svelte'
	import type { DataMessage } from '$lib/stores/chat'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import { profile } from '$lib/stores/profile'
	import { walletStore } from '$lib/stores/wallet'
	export let message: DataMessage

	$: name = (
		$objectStore.objects.get(objectKey(message.objectId, message.instanceId)) as { name?: string }
	)?.name

	async function sendMessage() {
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')

		const chatId = $page.params.id
		const name = $profile.name

		await adapter.sendData(wallet, chatId, message.objectId, message.instanceId, { name })
	}
</script>

<div>
	{#if name}
		Sent 'Hello from {name}'
	{:else}
		<Button variant="strong" on:click={sendMessage}>Send Hello!</Button>
	{/if}
</div>

<style lang="scss">
</style>
