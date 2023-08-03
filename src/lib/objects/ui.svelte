<script lang="ts">
	import { walletStore } from '$lib/stores/wallet'
	import adapter from '$lib/adapters'
	import { lookup } from './lookup'
	import { balanceStore, type Token } from '$lib/stores/balances'
	import { chats, type Chat } from '$lib/stores/chat'
	import type { WakuObjectArgs } from '.'
	import { profile } from '$lib/stores/profile'
	import { makeWakuObjectAdapter } from './adapter'
	import type { User } from '$lib/types'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import { throwError } from '$lib/utils/error'

	export let objectId: string
	export let instanceId: string
	export let chatId: string
	export let onViewChange: ((view: string) => void) | undefined = undefined

	const component = lookup(objectId)?.standalone

	const wallet = $walletStore.wallet
	if (!wallet) {
		// TODO: handle when there is not wallet (redirect to login)
		throw 'no wallet'
	}
	const address = wallet.address

	let store: unknown
	$: store = $objectStore.objects.get(objectKey(objectId, instanceId))
	let tokens: Token[]
	$: tokens = $balanceStore.balances
	let chat: Chat
	$: chat = $chats.chats.get(chatId) || throwError('chat not found')

	let userProfile: User
	$: if (address && !$profile.loading) {
		userProfile = {
			address,
			name: $profile.name,
			avatar: $profile.avatar,
		}
	}
	let users: User[]
	$: users = chat.users

	function send(data: unknown): Promise<void> {
		if (!$walletStore.wallet) throw new Error('not logged in')
		return adapter.sendData($walletStore.wallet, chatId, objectId, instanceId, data)
	}

	function updateStore(updater: (state: unknown) => unknown) {
		adapter.updateStore(address, objectId, instanceId, updater)
	}

	const wakuObjectAdapter = makeWakuObjectAdapter(adapter, wallet)

	let args: WakuObjectArgs
	$: if (userProfile && users) {
		args = {
			instanceId,
			profile: userProfile,
			users,
			tokens,
			store,
			send,
			updateStore,
			onViewChange,
			...wakuObjectAdapter,
		}
	}
</script>

{#if !args}
	<p>Loading...</p>
{:else}
	<svelte:component this={component} {args} />
{/if}
