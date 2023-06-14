<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import HelloWorldReceiver from './hello-world-receiver.svelte'
	import HelloWorldSender from './hello-world-sender.svelte'

	export let message: DataMessage

	const wallet = $walletStore.wallet
	const address = wallet?.address

	const component = address === message?.fromAddress ? HelloWorldSender : HelloWorldReceiver
</script>

<svelte:component this={component} {message} />
