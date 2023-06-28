<script lang="ts">
	import { walletStore } from '$lib/stores/wallet'
	import adapter from '$lib/adapters'
	import { lookup } from './lookup'
	import { page } from '$app/stores'
	import { balanceStore, type Token } from '$lib/stores/balances'
	import { chats } from '$lib/stores/chat'

	export let objectId: string
	export let instanceId: string
	export let chatId: string
	export let onViewChange: ((view: string) => void) | undefined = undefined

	const component = lookup(objectId)?.standalone

	$: tokens = $balanceStore.balances
	$: nativeToken = tokens.find((token) => token.symbol === 'ETH')
	$: chat = $chats.chats.get($page.params.id)
	$: fromUser = chat?.users.find((user) => user.address === $walletStore.wallet?.address)
	$: toUser = chat?.users.find((user) => user.address !== $walletStore.wallet?.address)

	let store: unknown | undefined
	$: if (nativeToken && tokens && fromUser && toUser) {
		store = { nativeToken, tokens, fromUser, toUser, view: $page.params.view }
	}

	function send(data: unknown): Promise<void> {
		if (!$walletStore.wallet) throw new Error('not logged in')
		return adapter.sendData($walletStore.wallet, chatId, objectId, instanceId, data)
	}

	function updateStore(updater: (state: unknown) => unknown): void {
		if (!$walletStore.wallet) throw new Error('not logged in')
		adapter.updateStore($walletStore.wallet, objectId, instanceId, updater)
	}

	function sendTransaction(to: string, token: Token, fee: Token) {
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')
		return adapter.sendTransaction(wallet, to, token, fee)
	}

	function estimateTransaction(to: string, amount: bigint, token: Token) {
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')
		return adapter.estimateTransaction(wallet, to, token)
	}

	// TODO: handle when there is not wallet (redirect to login)
</script>

{#if !store || !fromUser}
	<p>Loading...</p>
{:else}
	<svelte:component
		this={component}
		args={{
			address: fromUser.address,
			name: fromUser.name ?? '',
			send,
			updateStore,
			onViewChange,
			sendTransaction,
			estimateTransaction,
			store,
		}}
	/>
{/if}
