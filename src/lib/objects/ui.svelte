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
	import Container from '$lib/components/container.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	import Button from '$lib/components/button.svelte'
	import UserFollow from '$lib/components/icons/user-follow.svelte'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import Login from '$lib/components/icons/login.svelte'

	export let objectId: string
	export let instanceId: string
	export let chatId: string
	export let onViewChange: ((view: string) => void) | undefined = undefined
	export let view: string | undefined = undefined

	const component = lookup(objectId)?.standalone

	let args: WakuObjectArgs
	let store: unknown
	let tokens: Token[]
	let chat: Chat
	let userProfile: User
	let users: User[]

	$: wallet = $walletStore.wallet

	$: loading =
		$walletStore.loading ||
		$chats.loading ||
		$objectStore.loading ||
		$balanceStore.loading ||
		$profile.loading

	$: noWallet = !wallet && !$walletStore.loading

	function send(data: unknown): Promise<void> {
		if (!$walletStore.wallet) throw new Error('not logged in')
		return adapter.sendData($walletStore.wallet, chatId, objectId, instanceId, data)
	}

	function updateStore(updater: (state: unknown) => unknown) {
		if (!$walletStore.wallet) throw new Error('not logged in')
		adapter.updateStore($walletStore.wallet.address, objectId, instanceId, updater)
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
		//FIXME: user may not be part of this chat, handle that
		chat = $chats.chats.get(chatId) || throwError('chat not found')
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

{#if noWallet}
	<Container align="center" alignItems="center" gap={12} justify="center" grow padX={24}>
		<div class="chatbot">
			<div>
				<ChatBot size={32} />
			</div>
			<p class="text-lg text-bold">Waku Play</p>
		</div>
		<Button on:click={() => goto(routes.IDENTITY_NEW)}>
			<UserFollow />
			Create new identity
		</Button>
		<Button on:click={() => goto(routes.IDENTITY_CONNECT)}>
			<Login />
			Connect existing identity
		</Button>
	</Container>
{:else if loading}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else}
	<svelte:component this={component} {args} />
{/if}
