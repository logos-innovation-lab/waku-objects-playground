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
	import { chats } from '$lib/stores/chat'
	import { exchangeStore } from '$lib/stores/exchangeRates'
	import { errorStore } from '$lib/stores/error'
	import { preferences } from '$lib/stores/preferences'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'

	export let message: DataMessage
	export let users: User[]

	const { wakuObject } = lookup(message.objectId) || {}

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

	const chat = $chats.chats.get(chatId)

	let args: WakuObjectArgs
	$: if ((userProfile, chat)) {
		const wakuObjectAdapter = makeWakuObjectAdapter(adapter, wallet)
		const chatName =
			chat?.name ?? users.find((u) => u.address !== userProfile.address)?.name ?? 'Unknown'
		args = {
			chainId: defaultBlockchainNetwork.chainId,
			chatId,
			objectId: message.objectId,
			instanceId: message.instanceId,
			profile: userProfile,
			users,
			tokens,
			exchangeRates: $exchangeStore.exchange,
			fiatSymbol: $preferences.fiatSymbol,
			store,
			viewParams: [],
			chatName,
			addError: errorStore.addEnd,
			send: (data: JSONSerializable) =>
				adapter.sendData(wallet, chatId, message.objectId, message.instanceId, data),
			updateStore,
			...wakuObjectAdapter,
			onViewChange: (view: string, ...rest) => {
				goto(
					routes.OBJECT(
						chatId,
						message.objectId,
						message.instanceId,
						`${[view, ...rest].join('/')}`,
					),
				)
			},
		}
	}
</script>

<svelte:component this={wakuObject} {message} {args} />
