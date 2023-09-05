<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import adapter from '$lib/adapters'
	import { page } from '$app/stores'
	import { profile } from '$lib/stores/profile'
	import type { JSONSerializable, WakuObjectArgs } from '.'
	import { lookup } from './lookup'
	import type { User } from './schemas'
	import { makeWakuObjectAdapter } from './adapter'
	import { balanceStore } from '$lib/stores/balances'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'

	export let message: DataMessage
	export let users: User[]

	const { wakuObject, customArgs } = lookup(message.objectId) || {}

	let store: JSONSerializable | undefined
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

	function updateStore(updater: (state: JSONSerializable) => JSONSerializable) {
		adapter.updateStore(address, message.objectId, message.instanceId, updater)
	}

	let args: WakuObjectArgs
	$: if (userProfile) {
		const wakuObjectAdapter = makeWakuObjectAdapter(adapter, wallet)
		args = {
			chatId,
			objectId: message.objectId,
			instanceId: message.instanceId,
			profile: userProfile,
			users,
			tokens,
			store,
			send: (data: JSONSerializable) =>
				adapter.sendData(wallet, chatId, message.objectId, message.instanceId, data),
			updateStore,
			...wakuObjectAdapter,
			onViewChange: (view: string) => {
				goto(routes.OBJECT(chatId, message.objectId, message.instanceId, view))
			},
		}
	}
</script>

<svelte:component this={wakuObject} {message} {args} {customArgs} />
