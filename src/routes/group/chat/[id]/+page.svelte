<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import {
		Add,
		ArrowUp,
		ChevronLeft,
		Close,
		Events,
		Checkmark,
		Settings,
	} from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import WakuObject from '$lib/objects/chat.svelte'

	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { browser } from '$app/environment'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import { textToHTML } from '$lib/utils/text'
	import Spacer from '$lib/components/spacer.svelte'
	import { walletStore } from '$lib/stores/wallet'
	import type { User } from '$lib/types'
	import {
		areDifferentDays,
		formatTimestampSeparator,
		formatTimestampTime,
	} from '$lib/utils/format'
	import ChatDateBadge from '$lib/components/chat-date-badge.svelte'
	import { errorStore } from '$lib/stores/error'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'
	import ChatObjectInvite from '$lib/components/chat-object-invite.svelte'

	let div: HTMLElement
	let autoscroll = true

	$: chat = $chats.chats.get($page.params.id)

	beforeUpdate(() => {
		autoscroll = div && div.offsetHeight + div.scrollTop > div.scrollHeight - 74
	})

	afterUpdate(() => {
		if (autoscroll) div.scrollTo({ top: div.scrollHeight, behavior: 'smooth' })

		if (chat?.unread) {
			chats.updateChat($page.params.id, (chat) => ({ ...chat, unread: 0 }))
		}
	})

	onMount(() => {
		// It can not be done in onMount because the div is not yet rendered
		setTimeout(() => {
			if (browser && div) {
				div.scrollTo({
					top: div.scrollHeight,
					behavior: 'auto',
				})
			}
		}, 0)

		if (chat?.unread) {
			chats.updateChat($page.params.id, (chat) => ({ ...chat, unread: 0 }))
		}
	})

	$: messages = $chats.chats.get($page.params.id)?.messages || []
	let isSending = false
	let text = ''

	const sendMessage = async (wallet: HDNodeWallet) => {
		isSending = true
		const messageText = replaceNamesWithAddresses(text)
		try {
			await adapters.sendChatMessage(wallet, $page.params.id, messageText)
		} catch (error) {
			errorStore.addEnd({
				title: 'Message Error',
				message: `Failed to send message. ${(error as Error)?.message}`,
				retry: () => sendMessage(wallet),
			})
		}
		text = ''
		isSending = false
	}

	$: inviter = chat?.users.find((user) => user.publicKey === chat?.inviter)
	$: wallet = $walletStore.wallet

	function join() {
		chats.updateChat($page.params.id, (chat) => ({ ...chat, joined: true }))
	}

	async function decline() {
		if (wallet?.signingKey.compressedPublicKey) {
			chats.removeChat($page.params.id)
			adapters.removeFromGroupChat($page.params.id, wallet.signingKey.compressedPublicKey)
			goto(ROUTES.HOME)
		}
	}

	function htmlize(s: string) {
		const txt = document.createElement('textarea')
		txt.innerHTML = s
		return txt.value
	}

	function replaceAddressesWithNames(s: string) {
		if (!chat) {
			return s
		}
		for (const user of chat.users) {
			const userAddress = publicKeyToAddress(user.publicKey)
			s = s.replaceAll(`@${userAddress}`, `@${user.name || userAddress}`)
		}
		return s
	}

	function replaceNamesWithAddresses(s: string) {
		if (!chat) {
			return s
		}

		const nameLength = (user: User) => user.name?.length ?? 0
		const sortedUsers = chat.users.sort((a, b) => nameLength(b) - nameLength(a))

		for (const user of sortedUsers) {
			if (!user.name) {
				continue
			}
			const userAddress = publicKeyToAddress(user.publicKey)
			s = s.replaceAll(`@${user.name}`, `@${userAddress}`)
		}
		return s
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if !chat}
		<Layout>
			<Container align="center" gap={6} justify="center" padX={24}>
				<h2>Could not find group chat.</h2>
			</Container>
		</Layout>
	{:else}
		<Layout bgColor="shade">
			<svelte:fragment slot="header">
				<Header>
					<Button variant="icon" slot="left" on:click={() => goto(ROUTES.HOME)}>
						<ChevronLeft />
					</Button>
					<svelte:fragment slot="chat">
						<Avatar group picture={chat?.avatar} seed={chat?.chatId} />
						<span class="truncate">
							{chat?.name}
						</span>
						<span class="group-icon">
							<Events />
						</span>
					</svelte:fragment>
					<svelte:fragment slot="right">
						{#if chat.joined}
							<Button variant="icon" on:click={() => goto(ROUTES.GROUP_EDIT($page.params.id))}>
								<Settings />
							</Button>
						{/if}
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			{#if !chat.joined}
				<Container justify="center" alignItems="center" gap={0} padX={24}>
					<Avatar group picture={chat?.avatar} seed={chat?.chatId} size={140} />
					<Spacer />
					<p class="text-lg text-bold text-center">Join "{chat?.name}"?</p>
					<Spacer height={12} />
					<p class="text-lg text-center">
						{inviter?.name} invited you to join the "{chat?.name}" group chat.
					</p>
					<Spacer />
					<Container direction="row" justify="center" gap={12} alignItems="center" padY={0}>
						<Button align="center" variant="strong" on:click={() => join()}>
							<Checkmark />
							Join group
						</Button>
						<Button align="left" on:click={() => decline()}>
							<Close />
							Decline
						</Button>
					</Container>
				</Container>
			{:else}
				{@const publicKey = wallet.signingKey.compressedPublicKey}
				<div class="chat-messages" bind:this={div}>
					<Container grow>
						<div class="messages">
							<div class="messages-inner">
								<!-- Chat bubbles -->
								{#each messages as message, i}
									{@const sender = chat.users.find((u) => message.senderPublicKey === u.publicKey)}
									{#if message.type === 'user' && message.text?.length > 0}
										{@const sameSender =
											messages[i].senderPublicKey === messages[i - 1]?.senderPublicKey}
										{@const lastMessage =
											i + 1 === messages.length ||
											messages[i].senderPublicKey !== messages[i + 1]?.senderPublicKey ||
											messages[i + 1]?.type !== 'user'}
										{#if i === 0 || (i > 0 && areDifferentDays(messages[i].timestamp, messages[i - 1].timestamp))}
											<ChatDateBadge text={formatTimestampSeparator(message.timestamp)} />
										{/if}
										<ChatMessage
											myMessage={message.senderPublicKey === publicKey ? true : false}
											bubble
											group
											{sameSender}
											senderName={message.senderPublicKey === publicKey || !lastMessage
												? undefined
												: sender?.name}
											timestamp={lastMessage
												? formatTimestampTime(lastMessage ? message.timestamp : 0)
												: undefined}
										>
											{@html replaceAddressesWithNames(textToHTML(htmlize(message.text)))}
											<svelte:fragment slot="avatar">
												{#if message.senderPublicKey !== publicKey && lastMessage}
													<Avatar size={40} picture={sender?.avatar} seed={sender?.publicKey} />
												{/if}
											</svelte:fragment>
										</ChatMessage>
									{:else if message.type === 'data'}
										<WakuObject {message} users={chat.users} />
									{:else if message.type === 'install'}
										<ChatObjectInvite
											{message}
											group={true}
											chatId={$page.params.id}
											myMessage={message.senderPublicKey === publicKey ? true : false}
											users={chat.users}
											objects={chat.objects}
											timestamp={formatTimestampTime(message.timestamp)}
											senderName={message.senderPublicKey === publicKey ? undefined : sender?.name}
										>
											<svelte:fragment slot="avatar">
												{#if message.senderPublicKey !== publicKey}
													<Avatar size={40} picture={sender?.avatar} seed={sender?.publicKey} />
												{/if}
											</svelte:fragment>
										</ChatObjectInvite>
									{/if}
								{/each}
							</div>
						</div>
					</Container>
				</div>
				<div class="chat-input-wrapper">
					<Container>
						<div class="chat-input">
							<Button variant="icon" on:click={() => goto(ROUTES.OBJECTS($page.params.id))}>
								<Add />
							</Button>
							<Textarea
								placeholder="Message"
								autofocus
								bind:value={text}
								on:keypress={(e) => {
									// When enter is pressed without modifier keys, send the message
									if (e.key === 'Enter' && !(e.shiftKey || e.ctrlKey || e.altKey)) {
										sendMessage(wallet)
										e.preventDefault()
									}
									// When shift+enter is pressed, add a newline
									else if (e.key === 'Enter' && (e.altKey || e.ctrlKey)) {
										text += '\n'
										e.preventDefault()
									}
								}}
							/>
							{#if text.length > 0}
								<Button variant="strong" disabled={isSending} on:click={() => sendMessage(wallet)}>
									<ArrowUp />
								</Button>
							{/if}
						</div>
					</Container>
				</div>
			{/if}
		</Layout>
	{/if}
</AuthenticatedOnly>

<style lang="scss">
	.messages {
		flex-grow: 1;
	}
	.messages-inner {
		padding-top: var(--spacing-48);
		overflow-y: auto;
	}

	.chat-messages {
		flex-grow: 1;
		overflow-y: auto;
	}

	.chat-input-wrapper {
		flex-grow: 0;
		position: sticky;
		bottom: 0;
		background-color: var(--color-base, var(--color-dark-accent));
		border-top: 1px solid var(--color-step-20, var(--color-dark-step-40));
		padding-bottom: env(safe-area-inset-bottom);
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}

	.text-center {
		text-align: center;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.group-icon {
		width: 20px;
		height: 20px;
		aspect-ratio: 1;
	}
</style>
