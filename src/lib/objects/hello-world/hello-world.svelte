<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import type { HelloWorldStore } from '.'
	import type { WakuObjectArgs } from '..'
	import HelloWorldReceiver from './hello-world-receiver.svelte'
	import HelloWorldSender from './hello-world-sender.svelte'

	export let message: DataMessage
	export let args: WakuObjectArgs

	$: helloWorldStore = args.store as HelloWorldStore | undefined
	$: address = args.address
</script>

{#if address === message?.fromAddress}
	<HelloWorldSender name={helloWorldStore?.name} />
{:else}
	<HelloWorldReceiver name={helloWorldStore?.name} send={args.send} ownName={args.name} />
{/if}
