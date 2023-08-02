<script lang="ts">
	import ChatMessage from './chat-message.svelte'
	export let myMessage = false
</script>

<ChatMessage bubble object {myMessage}>
	<slot />
</ChatMessage>
