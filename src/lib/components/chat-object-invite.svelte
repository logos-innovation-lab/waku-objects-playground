<script lang="ts">
	import { CheckmarkFilled, Checkmark, Pending } from 'carbon-icons-svelte'

	import adapters from '$lib/adapters'
	import routes from '$lib/routes'
	import type { InstallMessage, WithMeta } from '$lib/stores/chat'
	import { installedObjectStore } from '$lib/stores/installed-objects'
	import type { User } from '$lib/types'
	import Button from './button.svelte'
	import ChatMessage from './chat-message.svelte'
	import Container from './container.svelte'
	import Loading from './loading.svelte'
	import ObjectInstallInfo from './object-install-info.svelte'

	import { goto } from '$app/navigation'
	import { hashString } from '$lib/adapters/waku/crypto'

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
	export let senderName: string | undefined = undefined

	export let timestamp: string | undefined = undefined

	let senderNameLabel = myMessage
		? 'You'
		: users.find((user) => user.publicKey === message.senderPublicKey)?.name ?? '<unknown>'
	let recipientName = !group
		? myMessage
			? users.find((user) => user.publicKey !== message.senderPublicKey)?.name ?? '<unknown>'
			: 'you'
		: `chat members`

	$: object = $installedObjectStore.objects.get(message.objectId)
	$: isInstalledInChat = object && objects && objects.includes(object.objectId)

	async function acceptInstall(objectId: string) {
		await adapters.sendInstall(chatId, objectId, 'accept')
	}
</script>

<ChatMessage bubble={true} {group} {sameSender} {timestamp} {myMessage} object={true} {senderName}>
	{#if !object}
		<Loading />
	{:else}
		<div class="wo text-normal">
			<Container>
				{#if message.command === 'invite'}
					{senderNameLabel} invited {recipientName} to use "{object.name}" in this chat.
				{:else if message.command === 'accept'}
					{senderNameLabel} accepted the invite. You can now use "{object.name}" in this chat.
				{/if}
			</Container>
			<Container gap={12}>
				<ObjectInstallInfo
					onClick={() => object && goto(routes.SETTINGS_OBJECT(hashString(object.objectId)))}
					name={object.name}
					logoImg={object.logo}
					logoAlt={`${object.name} logo`}
				/>
			</Container>
			<Container padY={0}>
				{#if message.command === 'invite'}
					{#if isInstalledInChat}
						<p class="install-status">
							<CheckmarkFilled />Invite accepted
						</p>
					{:else if myMessage}
						<p class="install-status">
							<Pending />Invite pending
						</p>
					{:else}
						<Button variant="strong" on:click={() => acceptInstall(message.objectId)}
							><Checkmark /> Accept</Button
						>
					{/if}
				{:else if message.command === 'accept'}
					<p class="install-status">
						{#if isInstalledInChat}
							<CheckmarkFilled />Invite accepted
						{:else}
							<Pending />Invite pending
						{/if}
					</p>
				{/if}
			</Container>
		</div>
	{/if}
	<svelte:fragment slot="avatar">
		{#if $$slots.avatar}
			<slot name="avatar" />
		{/if}
	</svelte:fragment>
</ChatMessage>

<style lang="scss">
	.install-status {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-6);
		background-color: var(--color-step-10, var(--color-dark-step-50));
		border-radius: var(--spacing-24);
		padding: var(--spacing-6);
	}
</style>
