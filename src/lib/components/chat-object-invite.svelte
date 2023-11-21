<script lang="ts">
	import adapters from '$lib/adapters'
	import type { InstallMessage, WithMeta } from '$lib/stores/chat'
	import { installedObjectStore } from '$lib/stores/installed-objects'
	import type { User } from '$lib/types'
	import Button from './button.svelte'
	import ChatMessage from './chat-message.svelte'
	import Container from './container.svelte'
	import CheckmarkFilled from './icons/checkmark-filled.svelte'
	import Loading from './loading.svelte'
	import ObjectHeader from './object-header.svelte'

	//am I the sender of this message?
	export let myMessage = false
	export let message: WithMeta<InstallMessage>
	export let users: User[]
	export let objects: string[] | undefined
	export let chatId: string

	//is this message in a group chat?
	export let group = false

	//is the sender of the current message the same as the previous message?
	export let sameSender = false

	export let timestamp: string | undefined = undefined

	let senderName =
		users.find((user) => user.publicKey === message.senderPublicKey)?.name ?? '<unknown>'
	let recipientName = myMessage
		? 'you'
		: users.length === 2
		? users.find((user) => user.publicKey !== message.senderPublicKey)?.name ?? '<unknown>'
		: `chat members`

	$: object = $installedObjectStore.objects.get(message.objectId)
	$: isInstalledInChat = object && objects && objects.includes(object.objectId)

	async function acceptInstall(objectId: string) {
		await adapters.sendInstall(chatId, objectId, 'accept')
	}
</script>

<ChatMessage bubble={true} {group} {sameSender} {timestamp} {myMessage}>
	{#if !object}
		<Loading />
	{:else}
		<div class="wo text-normal">
			<Container>
				{#if message.command === 'invite'}
					{senderName} invited {recipientName} to use "{object.name}" in this chat.
				{:else if message.command === 'accept'}
					{senderName} accepted the invite. You can now use "{object.name}" in this chat.
				{/if}
			</Container>
			<Container gap={12}>
				<ObjectHeader name={object.name} logoImg={object.logo} logoAlt={`${object.name} logo`} />
			</Container>
			<Container padY={0}>
				{#if message.command === 'invite'}
					{#if myMessage}
						<p class="install-status">
							{#if isInstalledInChat}
								<CheckmarkFilled />Invite accepted
							{:else}
								Invite pending...
							{/if}
						</p>
					{:else}
						<Button variant="strong" on:click={() => acceptInstall(message.objectId)}>Accept</Button
						>
					{/if}
				{:else if message.command === 'accept'}
					<p class="install-status">
						{#if isInstalledInChat}
							<CheckmarkFilled />Invite accepted
						{:else}
							Invite pending...
						{/if}
					</p>
				{/if}
			</Container>
		</div>
	{/if}
</ChatMessage>

<style lang="scss">
	.install-status {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);
	}
</style>
