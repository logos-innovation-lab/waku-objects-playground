<script lang="ts">
	import { goto } from '$app/navigation'

	// Icons
	import AddComment from '$lib/components/icons/add-comment.svelte'
	import Login from '$lib/components/icons/login.svelte'
	import WakuLogo from '$lib/components/icons/waku-logo.svelte'
	import NewChat from '$lib/components/icons/add-comment.svelte'
	import UserFollow from '$lib/components/icons/user-follow.svelte'

	// Components
	import Avatar from '$lib/components/avatar.svelte'
	import Badge from '$lib/components/badge.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'

	// Stores
	import { profile } from '$lib/stores/profile'
	import { chats } from '$lib/stores/chat'

	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'

	// FIXME temporary hack
	function isGroupChat(id: string) {
		return id.length === 64
	}
</script>

<div class="wrapper">
	{#if $profile.loading || $walletStore.loading}
		<Container align="center" grow gap={6} justify="center">
			<div class="center">
				<h2>Loading...</h2>
			</div>
		</Container>
	{:else if !$walletStore.wallet}
		<Container align="center" alignItems="center" gap={12} justify="center" grow padX={24}>
			<div class="chatbot">
				<div>
					<WakuLogo size={48} />
				</div>
				<p class="text-lg text-bold">Waku Play</p>
			</div>
			<Button on:click={() => goto(ROUTES.IDENTITY_NEW)}>
				<UserFollow />
				Create new identity
			</Button>
			<Button on:click={() => goto(ROUTES.IDENTITY_CONNECT)}>
				<Login />
				Connect existing identity
			</Button>
		</Container>
	{:else if $chats.loading}
		<Container align="center" grow gap={6} justify="center" padX={24}>
			<div class="center">
				<h2>Loading...</h2>
			</div>
		</Container>
	{:else if $chats.error}
		<Container align="center" grow gap={6} justify="center" padX={24}>
			<div class="center">
				<h2>Failed to load chats: {$chats.error.message}</h2>
			</div>
		</Container>
	{:else if $chats.chats.size === 0}
		{@const address = $walletStore.wallet.address}
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
		<Container align="center" grow gap={6} justify="center" padX={24}>
			<p class="text-lg text-bold">No active chats</p>
			<p class="text-lg">Invite someone to chat</p>
			<div class="btn-spacing">
				<Button on:click={() => goto(ROUTES.INVITE(address))}>
					<AddComment />
					Invite to chat
				</Button>
			</div>
		</Container>
	{:else}
		{@const address = $walletStore.wallet.address}
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
		<div class="grow">
			<ul class="chats" aria-label="Chat List">
				{#each [...$chats.chats, ...$chats.groups] as [id, chat]}
					{@const userMessages = chat.messages.filter((message) => message.type === 'user')}
					{@const lastMessage =
						userMessages.length > 0 ? userMessages[userMessages.length - 1] : undefined}
					{@const myMessage = lastMessage && lastMessage.fromAddress === $walletStore.wallet.address}
					{@const otherUser = chat.users.find((m) => m.address !== $walletStore.wallet?.address)}
					<li>
						<div
							class="chat-button"
							on:click={() => (isGroupChat(id) ? goto(ROUTES.GROUP_CHAT(id)) : goto(ROUTES.CHAT(id)))}
							on:keypress={() =>
								isGroupChat(id) ? goto(ROUTES.GROUP_CHAT(id)) : goto(ROUTES.CHAT(id))}
							role="button"
							tabindex="0"
						>
							<Container grow>
								<div class="chat">
									<!-- TODO: WHAT HAPPENS TO THE AVATAR IF IT'S A GROUP CHAT? -->
									{#if chat.users.length === 2}
										<Avatar size={70} picture={otherUser?.avatar} />
									{/if}
									<div class="content">
										<div class="user-info">
											<span class="username text-lg text-bold">
												{otherUser?.name}
												<Badge dark>
													{chat.messages.length}
												</Badge>
											</span>
										</div>
										<p class={`message text-serif ${myMessage ? 'my-message' : ''}`}>
											{myMessage ? 'You: ' : ''}
											{lastMessage && lastMessage.type === 'user'
												? lastMessage.text.substring(0, 50)
												: 'No messages yet'}
										</p>
									</div>
								</div>
							</Container>
						</div>
					</li>
				{:else}
					<Container align="center" grow gap={6} justify="center">
						<div class="center">
							<p>No chats</p>
						</div>
					</Container>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style lang="scss">
	.wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
	}

	.grow {
		flex-grow: 1;
		overflow-y: auto;
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
		}
	}

	.user-info {
		margin-bottom: var(--spacing-3);
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: baseline;
		justify-content: space-between;
	}

	.username {
		display: inline-flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
	}

	.timestamp {
		font-size: var(--font-size-sm);
		color: var(--color-step-40);
		margin-left: auto;
	}

	.chatbot {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		margin-bottom: var(--spacing-12);
		div {
			line-height: 0;
		}
	}

	.my-message {
		font-style: italic;
	}
</style>
