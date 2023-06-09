<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'
	import { HELLO_WORLD_OBJECT_ID } from './hello-world'
	import HelloWorld from './hello-world/hello-world.svelte'

	export let message: DataMessage

	function selectComponent() {
		switch (message.objectId) {
			case HELLO_WORLD_OBJECT_ID:
				return HelloWorld
		}
	}
	const component = selectComponent()
</script>

<div
	class={`message ${
		message.fromAddress !== $walletStore.wallet?.address ? 'their-message' : 'my-message'
	}`}
>
	<div class="message-content">
        <svelte:component this={component} {message} />
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
