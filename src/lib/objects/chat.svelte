<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import adapter from '$lib/adapters'
	import { page } from '$app/stores'
	import { profile } from '$lib/stores/profile'
	import type { WakuObjectArgs } from '.'
	import { lookup } from './lookup'
	import type { User } from './schemas'
	import { makeWakuObjectAdapter } from './adapter'
	import { balanceStore } from '$lib/stores/balances'

	export let message: DataMessage
	export let users: User[]

	const component = lookup(message.objectId)?.wakuObject

	let store: unknown
	$: store = $objectStore.objects.get(objectKey(message.objectId, message.instanceId))
	const wallet = $walletStore.wallet
	if (!wallet) {
		throw 'no wallet'
	}
	const chatId = $page.params.id
	const address = wallet.address

	let userProfile: User
	$: if (address && !$profile.loading) {
		userProfile = {
			address,
			name: $profile.name,
			avatar: $profile.avatar,
		}
	}

	$: tokens = $balanceStore.balances

	let args: WakuObjectArgs
	$: if (userProfile) {
		const wakuObjectAdapter = makeWakuObjectAdapter(adapter, wallet)
		args = {
			instanceId: message.instanceId,
			profile: userProfile,
			users,
			tokens,
			store,
			updateStore: (updater) => {
				adapter.updateStore(address, message.objectId, message.instanceId, updater)
			},
			send: (data: unknown) =>
				adapter.sendData(wallet, chatId, message.objectId, message.instanceId, data),
			...wakuObjectAdapter,
		}
	}
</script>

<svelte:component this={component} {message} {args} />
