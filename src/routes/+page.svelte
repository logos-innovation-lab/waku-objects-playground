<script lang="ts">
	import { goto } from '$app/navigation'

	// Icons
	import AddComment from '$lib/components/icons/add-comment.svelte'
	import NewChat from '$lib/components/icons/add-comment.svelte'

	// Components
	import Avatar from '$lib/components/avatar.svelte'
	import Badge from '$lib/components/badge.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'

	// Stores
	import { profile } from '$lib/stores/profile'
	import { chats, isGroupChatId, type Chat, type Message } from '$lib/stores/chat'

	import ROUTES from '$lib/routes'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Events from '$lib/components/icons/events.svelte'

	$: orderedChats = Array.from($chats.chats)
		.map(([, chat]) => chat)
		.sort((a, b) => lastChatMessageTimestamp(b) - lastChatMessageTimestamp(a))
		.filter((chat) => chat.chatId) // HACK to remove early version broken group chats

	function lastChatMessageTimestamp(chat: Chat) {
		const lastMessage = chat.messages.slice(-1)[0]
		return lastMessage ? lastMessage.timestamp : 0
	}

	function lastSenderName(chat: Chat, myMessage?: boolean, lastMessage?: Message) {
		if (myMessage) {
			return 'You: '
		}

		if (isGroupChatId(chat.chatId)) {
			const name = chat.users.find((user) => user.address === lastMessage?.fromAddress)?.name
			return name ? `${name}: ` : ''
		}

		return ''
	}

	$: loading = $profile.loading || $chats.loading
</script>

<AuthenticatedOnly let:wallet>
	<div class="wrapper">
		{#if loading}
			<Layout>
				<Container align="center" gap={6} justify="center">
					<h2>Loading...</h2>
				</Container>
			</Layout>
		{:else if $chats.error}
			<Layout>
				<Container align="center" gap={6} justify="center" padX={24}>
					<h2>Failed to load chats: {$chats.error.message}</h2>
				</Container>
			</Layout>
		{:else if $chats.chats.size === 0}
			{@const address = wallet.address}
			<Layout>
				<svelte:fragment slot="header">
					<Header mainContent="right">
						<svelte:fragment slot="left">
							<div class="header-btns">
								<Button variant="icon" on:click={() => goto(ROUTES.INVITE(address))}>
									<NewChat size={24} />
								</Button>
							</div>
						</svelte:fragment>
						<svelte:fragment slot="right">
							<Button align="right" variant="account" on:click={() => goto(ROUTES.IDENTITY)}>
								<svelte:fragment slot="avatar">
									<Avatar size={48} picture={$profile.avatar} />
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
						<Button on:click={() => goto(ROUTES.INVITE(address))}>
							<AddComment />
							Invite to chat
						</Button>
					</div>
				</Container>
			</Layout>
		{:else}
			{@const address = wallet.address}
			<Layout>
				<svelte:fragment slot="header">
					<Header mainContent="right">
						<svelte:fragment slot="left">
							<div class="header-btns">
								<Button variant="icon" on:click={() => goto(ROUTES.INVITE(address))}>
									<NewChat size={24} />
								</Button>
							</div>
						</svelte:fragment>
						<svelte:fragment slot="right">
							<Button align="right" variant="account" on:click={() => goto(ROUTES.IDENTITY)}>
								<svelte:fragment slot="avatar">
									<Avatar size={48} picture={$profile.avatar} />
								</svelte:fragment>
								{$profile.name}
							</Button>
						</svelte:fragment>
					</Header>
				</svelte:fragment>
				<ul class="chats" aria-label="Chat List">
					{#each orderedChats as chat}
						{@const userMessages = chat.messages.filter((message) => message.type === 'user')}
						{@const lastMessage =
							userMessages.length > 0 ? userMessages[userMessages.length - 1] : undefined}
						{@const myMessage = lastMessage && lastMessage.fromAddress === wallet.address}
						{@const otherUser = chat.users.find((m) => m.address !== wallet.address)}
						{@const senderName = lastSenderName(chat, myMessage, lastMessage)}
						<li>
							<div
								class="chat-button"
								on:click={() =>
									isGroupChatId(chat.chatId)
										? goto(ROUTES.GROUP_CHAT(chat.chatId))
										: goto(ROUTES.CHAT(chat.chatId))}
								on:keypress={() =>
									isGroupChatId(chat.chatId)
										? goto(ROUTES.GROUP_CHAT(chat.chatId))
										: goto(ROUTES.CHAT(chat.chatId))}
								role="button"
								tabindex="0"
							>
								<Container grow>
									<div class="chat">
										{#if isGroupChatId(chat.chatId)}
											<Avatar size={70} picture={chat?.avatar} />
										{:else}
											<Avatar size={70} picture={otherUser?.avatar} />
										{/if}
										<div class="content">
											<div class="chat-info">
												<span class="chat-name text-lg text-bold">
													{#if isGroupChatId(chat.chatId)}
														<span class="truncate">
															{chat?.name}
														</span>
														<Events />
													{:else}
														<span class="truncate">
															{otherUser?.name}
														</span>
													{/if}
													{#if chat.unread > 0}
														<Badge dark>
															{chat.unread}
														</Badge>
													{/if}
												</span>
											</div>
											<p class={`message text-serif ${myMessage ? 'my-message' : ''}`}>
												{senderName}
												{@html lastMessage && lastMessage.type === 'user'
													? lastMessage.text?.substring(0, 50)
													: 'No messages yet'}
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
		color: var(--color-step-40);
		margin-left: auto;
	}

	.my-message {
		font-style: italic;
	}
</style>
