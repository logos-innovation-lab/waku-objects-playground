<script lang="ts">
	import adapter from '$lib/adapters'
	import { lookup } from './lookup'
	import { balanceStore } from '$lib/stores/balances'
	import { chats, type Chat } from '$lib/stores/chat'
	import type { JSONSerializable, WakuObjectArgs } from '.'
	import { profile } from '$lib/stores/profile'
	import { makeWakuObjectAdapter } from './adapter'
	import type { User } from '$lib/types'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import Container from '$lib/components/container.svelte'
	import Loading from '$lib/components/loading.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import type { TokenAmount } from './schemas'
	import { exchangeStore } from '$lib/stores/exchangeRates'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import { errorStore } from '$lib/stores/error'
	import { preferences } from '$lib/stores/preferences'

	export let objectId: string
	export let instanceId: string
	export let chatId: string
	export let onViewChange: (view: string, ...args: string[]) => void
	export let view: string | undefined = undefined
	export let wallet: HDNodeWallet
	export let viewParams: string[]

	const component = lookup(objectId)?.standalone

	let args: WakuObjectArgs
	let store: JSONSerializable | undefined
	let tokens: TokenAmount[]
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
			const chatName =
				chat?.name ?? users.find((u) => u.address !== userProfile.address)?.name ?? 'Unknown'
			args = {
				chainId: defaultBlockchainNetwork.chainId,
				chatId,
				objectId,
				instanceId,
				profile: userProfile,
				users,
				tokens,
				chatName,
				store,
				send,
				updateStore,
				onViewChange,
				addError: errorStore.addEnd,
				view,
				viewParams,
				exchangeRates: $exchangeStore.exchange,
				fiatSymbol: $preferences.fiatSymbol,
				...wakuObjectAdapter,
			}
		}
	}
</script>

{#if loading}
	<Container align="center" grow gap={6} justify="center">
		<Loading />
	</Container>
{:else if !chat}
	<Container align="center" grow gap={6} justify="center">
		<h2>Chat not found</h2>
	</Container>
{:else}
	<svelte:component this={component} {args} />
{/if}
