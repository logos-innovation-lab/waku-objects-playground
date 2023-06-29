<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import type { HelloWorldStore } from '.'
	import type { WakuObjectArgs } from '..'
	import HelloWorldReceiver from './hello-world-receiver.svelte'
	import HelloWorldSender from './hello-world-sender.svelte'

	export let message: DataMessage
	export let args: WakuObjectArgs

	$: helloWorldStore = args.store as HelloWorldStore | undefined
	$: address = args.profile.address
</script>

{#if address === message?.fromAddress}
	<HelloWorldSender instanceId={message.instanceId} name={helloWorldStore?.name} />
{:else}
	<HelloWorldReceiver
		instanceId={message.instanceId}
		name={helloWorldStore?.name}
		send={args.send}
		updateStore={args.updateStore}
		ownName={args.profile.name || 'Anonymous'}
	/>
{/if}
