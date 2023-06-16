<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import { HELLO_WORLD_OBJECT_ID } from './hello-world'
	import HelloWorld from './hello-world/hello-world.svelte'
	import { objectKey, objectStore } from '$lib/stores/objects'
	import adapter from '$lib/adapters'
	import { page } from '$app/stores'
	import { profile } from '$lib/stores/profile'
	import type { WakuObjectArgs } from '.'

	export let message: DataMessage

	function selectComponent() {
		switch (message.objectId) {
			case HELLO_WORLD_OBJECT_ID:
				return HelloWorld
		}
	}
	const component = selectComponent()

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
		store,
		address,
		send: (data: unknown) =>
			adapter.sendData(wallet, chatId, message.objectId, message.instanceId, data),
	}
</script>

<div
	class={`message ${
		message.fromAddress !== $walletStore.wallet?.address ? 'their-message' : 'my-message'
	}`}
>
	<div class="message-content">
		<div class="message-text text-lg">
			<svelte:component this={component} {message} {args} />
		</div>
	</div>
</div>

<style lang="scss">
	.message {
		display: flex;
		gap: var(--spacing-6);
		flex-direction: column;
		align-items: flex-end;
		max-width: 75%;
		margin-right: auto;
		margin-left: 0;
		&:not(:last-child) {
			margin-bottom: var(--spacing-12);
		}

		&.my-message {
			font-style: italic;
			margin-left: auto;
			margin-right: 0;
		}
	}
	.message-content {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: flex-end;
		text-align: right;
	}

	.message-text {
		padding: var(--spacing-12);
		border-radius: var(--border-radius);
		display: inline-block;
		font-family: var(--font-serif);
		background-color: var(--white);
	}

	.their-message {
		align-items: flex-start;
		text-align: left;

		.message-content {
			text-align: left;
		}
	}
</style>
