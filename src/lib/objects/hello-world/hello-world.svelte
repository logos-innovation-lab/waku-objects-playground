<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import type { HelloWorldStore } from '.'
	import type { WakuObjectArgs } from '..'
	import HelloWorldReceiver from './hello-world-receiver.svelte'
	import HelloWorldSender from './hello-world-sender.svelte'

	export let message: DataMessage
	export let args: WakuObjectArgs

	$: helloWorldStore = args.store as HelloWorldStore
	$: publicKey = args.profile.publicKey
</script>

{#if publicKey === message?.senderPublicKey}
	<HelloWorldSender instanceId={message.instanceId} name={helloWorldStore?.name} />
{:else}
	<HelloWorldReceiver
		instanceId={message.instanceId}
		name={helloWorldStore?.name}
		send={args.send}
		ownName={args.profile.name || 'Anonymous'}
	/>
{/if}
