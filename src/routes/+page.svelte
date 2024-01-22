<script lang="ts">
	import { AddComment, Events } from 'carbon-icons-svelte'

	// Components
	import Avatar from '$lib/components/avatar.svelte'
	import Badge from '$lib/components/badge.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Loading from '$lib/components/loading.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Babbles from '$lib/components/icons/babbles.svelte'

	// Stores
	import { profile } from '$lib/stores/profile'
	import { chats, isGroupChat, type Chat, isBabbles, type ChatMessage } from '$lib/stores/chat'

	import { goto } from '$app/navigation'
	import ROUTES from '$lib/routes'
	import { formatTimestamp } from '$lib/utils/format'
	import { userDisplayName } from '$lib/utils/user'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	$: orderedChats = Array.from($chats.chats)
		.map(([, chat]) => chat)
		.sort(compareChats)

	function compareChats(a: Chat, b: Chat) {
		// put not joined chats at the top
		if (a.joined !== b.joined) {
			return (b.joined ? 0 : 1) - (a.joined ? 0 : 1)
		}
		return lastChatMessageTimestamp(b) - lastChatMessageTimestamp(a)
	}

	function lastChatMessageTimestamp(chat: Chat) {
		const lastMessage = chat.messages.slice(-1)[0]
		return lastMessage ? lastMessage.timestamp : 0
	}

	function lastSenderName(chat: Chat, myMessage?: boolean, lastMessage?: ChatMessage) {
		if (myMessage) {
			return 'You: '
		}

		if (isGroupChat(chat)) {
			const name = chat.users.find((user) => user.publicKey === lastMessage?.senderPublicKey)?.name
			return name ? `${name}: ` : ''
		}

		return ''
	}

	function replaceAddressesWithNames(s: string, chat: Chat) {
		if (!chat) {
			return s
		}
		for (const user of chat.users) {
			const userAddress = publicKeyToAddress(user.publicKey)
			s = s.replaceAll(`@${userAddress}`, `@${user.name || userAddress}`)
		}
		return s
	}

	function gotoChat(chat: Chat) {
		switch (chat.type) {
			case 'private':
				return goto(ROUTES.CHAT(chat.chatId))
			case 'group':
				return goto(ROUTES.GROUP_CHAT(chat.chatId))
			case 'babbles':
				return goto(ROUTES.BABBLES_CHAT(chat.chatId))
		}
	}

	$: loading = $profile.loading || $chats.loading
</script>

<AuthenticatedOnly let:wallet>
	<div class="wrapper">
		{#if loading}
			<Layout>
				<Container align="center" gap={6} justify="center">
					<Loading />
				</Container>
			</Layout>
		{:else if $chats.error}
			<Layout>
				<Container align="center" gap={6} justify="center" padX={24}>
					<h2>Failed to load chats: {$chats.error.message}</h2>
				</Container>
			</Layout>
		{:else if $chats.chats.size === 0}
			{@const publicKey = wallet.signingKey.compressedPublicKey}
			<Layout>
				<svelte:fragment slot="header">
					<Header mainContent="right">
						<svelte:fragment slot="left">
							<div class="header-btns">
								<Button variant="icon" on:click={() => goto(ROUTES.INVITE(publicKey))}>
									<AddComment size={24} />
								</Button>
							</div>
						</svelte:fragment>
						<svelte:fragment slot="right">
							<Button align="right" variant="account" on:click={() => goto(ROUTES.IDENTITY)}>
								<svelte:fragment slot="avatar">
									<Avatar size={48} picture={$profile.avatar} seed={publicKey} />
								</svelte:fragment>
								{$profile.name}
							</Button>
						</svelte:fragment>
					</Header>
				</svelte:fragment>
				<Container align="center" gap={6} justify="center" padX={24}>
					<p class="text-lg text-bold">No active chats</p>
					<p class="text-lg">Invite someone to chat</p>
					<div class="btn-spacing">
						<Button on:click={() => goto(ROUTES.INVITE(publicKey))}>
							<AddComment />
							Invite to chat
						</Button>
					</div>
				</Container>
			</Layout>
		{:else}
			{@const publicKey = wallet.signingKey.compressedPublicKey}
			<Layout>
				<svelte:fragment slot="header">
					<Header mainContent="right">
						<svelte:fragment slot="left">
							<div class="header-btns">
								<Button variant="icon" on:click={() => goto(ROUTES.INVITE(publicKey))}>
									<AddComment size={24} />
								</Button>
							</div>
						</svelte:fragment>
						<svelte:fragment slot="right">
							<Button align="right" variant="account" on:click={() => goto(ROUTES.IDENTITY)}>
								<svelte:fragment slot="avatar">
									<Avatar size={48} picture={$profile.avatar} seed={publicKey} />
								</svelte:fragment>
								{$profile.name}
							</Button>
						</svelte:fragment>
					</Header>
				</svelte:fragment>
				<ul class="chats" aria-label="Chat List">
					{#each orderedChats as chat}
						{@const userMessages = chat.messages.filter(
							(message) => message.type === 'user' || message.type === 'babble',
						)}
						{@const lastMessage =
							userMessages.length > 0 ? userMessages[userMessages.length - 1] : undefined}
						{@const myMessage = lastMessage && lastMessage.senderPublicKey === publicKey}
						{@const otherUser = chat.users.find((m) => m.publicKey !== publicKey)}
						{@const senderName = lastSenderName(chat, myMessage, lastMessage)}
						<li>
							<div
								class="chat-button"
								on:click={() => gotoChat(chat)}
								on:keypress={() => gotoChat(chat)}
								role="button"
								tabindex="0"
							>
								<Container grow>
									<div class="chat">
										{#if isGroupChat(chat) || isBabbles(chat)}
											<Avatar group size={70} picture={chat?.avatar} seed={chat.chatId} />
										{:else}
											<Avatar size={70} picture={otherUser?.avatar} seed={otherUser?.publicKey} />
										{/if}
										<div class="content">
											<div class="chat-info">
												<span class="chat-name text-lg text-bold">
													{#if isGroupChat(chat)}
														<span class="truncate">
															{chat?.name}
														</span>
														<Events />
													{:else if isBabbles(chat)}
														<span class="truncate">{chat?.name}</span>
														<Babbles />
													{:else}
														<span class="truncate">
															{userDisplayName(otherUser)}
														</span>
													{/if}
													{#if !chat.joined}
														<Badge dark>NEW</Badge>
													{:else if chat.unread > 0}
														<Badge dark>
															{chat.unread}
														</Badge>
													{/if}
												</span>
												<span class="timestamp">
													{formatTimestamp(lastMessage?.timestamp ?? 0)}
												</span>
											</div>
											<p class={`message text-serif ${myMessage ? 'my-message' : ''}`}>
												{#if chat.joined}
													{senderName}
													{@html lastMessage &&
													(lastMessage.type === 'user' || lastMessage.type === 'babble')
														? replaceAddressesWithNames(lastMessage.text?.substring(0, 150), chat)
														: 'No messages yet'}
												{:else if isGroupChat(chat)}
													{@const inviter = chat?.users.find(
														(user) => user.publicKey === chat?.inviter,
													)?.name}
													{inviter} invited you to join this group
												{:else}
													{@const inviter =
														chat.inviter ||
														chat.users.find((user) => user.publicKey !== publicKey)?.name}
													{inviter} wants to chat privately
												{/if}
											</p>
										</div>
									</div>
								</Container>
							</div>
						</li>
					{/each}
				</ul>
			</Layout>
		{/if}
	</div>
</AuthenticatedOnly>

<style lang="scss">
	.wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
	}

	.center {
		text-align: center;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		justify-content: center;
		align-items: center;
		place-items: center;
	}

	.btn-spacing {
		margin-top: var(--spacing-6);
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: var(--spacing-6);
	}

	.chats {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			display: flex;
			align-items: center;
			gap: var(--spacing-12);
			border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));

			.chat-button {
				width: 100%;
				cursor: pointer;
			}
		}
	}

	.chat {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-12);
		justify-content: flex-start;
		align-items: flex-start;

		.content {
			flex-grow: 1;
			overflow: hidden;
		}
	}

	.chat-info {
		margin-bottom: var(--spacing-3);
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: baseline;
		justify-content: space-between;
	}

	.chat-name {
		display: inline-flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
		max-width: 100%;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}

	.timestamp {
		font-size: var(--font-size-sm);
		font-family: sans-serif;
		color: var(--color-step-40);
		margin-left: auto;
	}

	.my-message {
		font-style: italic;
	}

	.message {
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
