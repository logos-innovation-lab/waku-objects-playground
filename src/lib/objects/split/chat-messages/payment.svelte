<script lang="ts">
	import Container from '$lib/components/container.svelte'
	import ObjectHeader from '$lib/components/object-header.svelte'
	import { splitDescriptor } from '..'
	import type { User } from '$lib/types'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import { toSignificant } from '$lib/utils/format'
	import type { TokenNoAmount } from '$lib/objects/schemas'

	export let myMessage: boolean
	export let amount: string
	export let sender: User | undefined = undefined
	export let instanceId: string
	export let token: TokenNoAmount
</script>

<ChatMessage {myMessage} object bubble>
	<div class="wo text-normal">
		<Container gap={12}>
			<ObjectHeader
				name={splitDescriptor.name}
				logoImg={splitDescriptor.logo}
				logoAlt={`${splitDescriptor.name} logo`}
			/>
			<p style="text-sm">{`${splitDescriptor.name} #${instanceId.slice(0, 4)}`}</p>
			{#if myMessage}
				You
			{:else}
				{sender?.name ?? 'Unknown'}
			{/if}
			paid {toSignificant(amount, token.decimals)}
			{token.symbol}.
		</Container>
	</div>
</ChatMessage>

<style>
	.wo {
		display: flex;
		flex-direction: column;
		font-family: var(--font-body);
		font-style: normal;
		text-align: left;
	}
</style>
