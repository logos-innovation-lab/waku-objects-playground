<script lang="ts">
	import adapter from '$lib/adapters'
	import { lookup } from './lookup'
	import { balanceStore, type Token } from '$lib/stores/balances'
	import { chats, type Chat } from '$lib/stores/chat'
	import type { JSONSerializable, WakuObjectArgs } from '.'
	import { profile } from '$lib/stores/profile'
	import { makeWakuObjectAdapter } from './adapter'
	import type { User } from '$lib/types'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import Container from '$lib/components/container.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'

	export let objectId: string
	export let instanceId: string
	export let chatId: string
	export let onViewChange: (view: string) => void
	export let view: string | undefined = undefined
	export let wallet: HDNodeWallet

	const component = lookup(objectId)?.standalone

	let args: WakuObjectArgs
	let store: JSONSerializable | undefined
	let tokens: Token[]
	let chat: Chat | undefined
	let userProfile: User
	let users: User[]

	$: loading = $chats.loading || $objectStore.loading || $balanceStore.loading

	function send(data: JSONSerializable): Promise<void> {
		return adapter.sendData(wallet, chatId, objectId, instanceId, data)
	}

	function updateStore(updater: (state: JSONSerializable) => JSONSerializable) {
		adapter.updateStore(wallet.address, objectId, instanceId, updater)
	}

	$: if (!loading && wallet) {
		const address = wallet.address

		store = $objectStore.objects.get(objectKey(objectId, instanceId))
		tokens = $balanceStore.balances

		if (address && !$profile.loading) {
			userProfile = {
				address,
				name: $profile.name,
				avatar: $profile.avatar,
			}
		}
		chat = $chats.chats.get(chatId)
	}

	$: if (chat) {
		users = chat.users

		const wakuObjectAdapter = makeWakuObjectAdapter(adapter, wallet)

		if (userProfile && users) {
			args = {
				instanceId,
				profile: userProfile,
				users,
				tokens,
				store,
				send,
				updateStore,
				onViewChange,
				view,
				...wakuObjectAdapter,
			}
		}
	}
</script>

{#if loading}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else if !chat}
	<Container align="center" grow gap={6} justify="center">
		<h2>Chat not found</h2>
	</Container>
{:else}
	<svelte:component this={component} {args} />
{/if}
