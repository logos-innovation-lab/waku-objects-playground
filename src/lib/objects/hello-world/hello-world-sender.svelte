<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { objectKey, objectStore } from '$lib/stores/objects'

	export let message: DataMessage

	$: name = (
		$objectStore.objects.get(objectKey(message.objectId, message.instanceId)) as { name?: string }
	)?.name
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
