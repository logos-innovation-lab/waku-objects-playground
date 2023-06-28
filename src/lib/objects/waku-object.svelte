<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import adapter from '$lib/adapters'
	import { page } from '$app/stores'
	import { profile } from '$lib/stores/profile'
	import type { WakuObjectArgs } from '.'
	import { lookup } from './lookup'

	export let message: DataMessage

	const component = lookup(message.objectId)?.wakuObject

	let store: unknown
	$: store = $objectStore.objects.get(objectKey(message.objectId, message.instanceId))
	const wallet = $walletStore.wallet
	if (!wallet) {
		throw 'no wallet'
	}
	const address = wallet.address
	const chatId = $page.params.id
	const name = $profile.name || address

	let args: WakuObjectArgs
	$: args = {
		name,
		address,
		store,
		updateStore: (updater) => {
			adapter.updateStore(wallet, message.objectId, message.instanceId, updater)
		},
		send: (data: unknown) =>
			adapter.sendData(wallet, chatId, message.objectId, message.instanceId, data),
	}
</script>

<svelte:component this={component} {message} {args} />

<style lang="scss">
</style>
