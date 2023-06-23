<script lang="ts">
	import { page } from '$app/stores'
	import { balanceStore } from '$lib/stores/balances'
	import { chats } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import SendToken from '$lib/objects/send_transaction/chat.svelte'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import adapter from '$lib/adapters'

	const chatId = $page.params.id
	const objectId = $page.params.object_id
	const instanceId = $page.params.instance_id

	$: wallet = $walletStore.wallet
	$: nativeToken = $balanceStore.balances.find((token) => token.symbol === 'ETH')
	$: chat = $chats.chats.get(chatId)
	$: fromUser = chat?.users.find((user) => user.address === wallet?.address)
	$: toUser = chat?.users.find((user) => user.address !== wallet?.address)

	function send(data: unknown): Promise<void> {
		if (!wallet) throw new Error('No wallet')
		return adapter.sendData(wallet, chatId, objectId, instanceId, data)
	}
	function updateStore(updater: (state: unknown) => unknown): void {
		if (!wallet) throw new Error('No wallet')
		adapter.updateStore(wallet, objectId, instanceId, updater)
	}
	function sendTransaction(): Promise<string> {
		return Promise.resolve('test')
	}
	let store: unknown
	$: store = $objectStore.objects.get(objectKey($page.params.object_id, $page.params.instance_id))
</script>

{#if !chat}
	<p>Chat not found</p>
{:else if !store}
	<p>Object not found</p>
{:else if !fromUser || !toUser}
	<p>No from/to users</p>
{:else if !nativeToken}
	<p>No native token</p>
{:else}
	<SendToken
		message={{
			type: 'data',
			fromAddress: fromUser.address,
			data: store,
			timestamp: Date.now(),
			objectId,
			instanceId,
		}}
		args={{
			address: fromUser.address,
			name: fromUser.name ?? '',
			send,
			sendTransaction,
			store,
			updateStore,
		}}
	/>
{/if}
