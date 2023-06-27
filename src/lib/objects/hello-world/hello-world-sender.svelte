<script lang="ts">
	import ChatMessage from '$lib/components/chat-message.svelte'

	export let instanceId: string
	export let name: string | undefined
</script>

{#if name}
	<ChatMessage myMessage bubble>
		{instanceId}: Hello from {name}
	</ChatMessage>
{:else}
	<ChatMessage myMessage bubble>
		{instanceId}: Hello World
	</ChatMessage>
{/if}

<style lang="scss">
</style>
