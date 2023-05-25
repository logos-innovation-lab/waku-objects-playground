<script lang="ts">
	import { goto } from '$app/navigation'

	// Icons
	import AddComment from '$lib/components/icons/add-comment.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	import Login from '$lib/components/icons/login.svelte'
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

	import { formatDateAndTime, formatAddress } from '$lib/utils/format'
	import ROUTES from '$lib/routes'
</script>

{#if $profile.loading}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else if !$profile.address}
	<Container align="center" alignItems="center" gap={12} justify="center" grow>
		<div class="chatbot">
			<div>
				<ChatBot size={32} />
			</div>
			<p class="text-lg text-bold">Waku chats</p>
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
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else if $chats.error}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Failed to load chats: {$chats.error.message}</h2>
		</div>
	</Container>
{:else if $chats.chats.size === 0}
	<Header>
		<svelte:fragment slot="left">
			<div class="header-btns">
				<Button variant="icon" on:click={() => goto(ROUTES.CHAT_NEW)}>
					<NewChat size={24} />
				</Button>
			</div>
		</svelte:fragment>
		<svelte:fragment slot="right">
			<Button variant="account" on:click={() => goto(ROUTES.IDENTITY)}>
				<svelte:fragment slot="avatar">
					<Avatar size={48} picture={$profile.avatar} />
				</svelte:fragment>
				{$profile.name ?? formatAddress($profile.address)}
			</Button>
		</svelte:fragment>
	</Header>
	<Container align="center" grow gap={6} justify="center">
		<p class="text-lg text-bold">No active chats</p>
		<p class="text-lg">Invite someone to chat</p>
		<div class="btn-spacing">
			<Button on:click={() => goto(ROUTES.CHAT_NEW)}>
				<AddComment />
				Invite to chat
			</Button>
		</div>
	</Container>
{:else}
	<Header>
		<svelte:fragment slot="left">
			<div class="header-btns">
				<Button variant="icon" on:click={() => goto(ROUTES.CHAT_NEW)}>
					<NewChat size={24} />
				</Button>
			</div>
		</svelte:fragment>
		<svelte:fragment slot="right">
			<Button variant="account" on:click={() => goto(ROUTES.IDENTITY)}>
				<svelte:fragment slot="avatar">
					<Avatar size={48} picture={$profile.avatar} />
				</svelte:fragment>
				{$profile.name ?? formatAddress($profile.address)}
			</Button>
		</svelte:fragment>
	</Header>
	<ul class="chats">
		{#each [...$chats.chats] as [id, chat]}
			{@const lastMessage = chat.messages[chat.messages.length - 1]}
			{#if lastMessage}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li on:click={() => goto(ROUTES.CHAT(id))}>
					<Container grow>
						<div class="chat">
							<Avatar size={70} picture={chat.users[0].avatar} />
							<div class="content">
								<div class="user-info">
									<span class="username text-lg text-bold">
										{chat.name ?? 'Unnamed chat'}
										<Badge dark>
											{chat.messages.length}
										</Badge>
									</span>
									<span class="timestamp">
										{formatDateAndTime(lastMessage.timestamp)}
									</span>
								</div>
								<p
									class={`message text-serif ${
										lastMessage.fromAddress === $profile.address ? 'my-message' : ''
									}`}
								>
									{lastMessage.fromAddress === $profile.address ? 'You: ' : ''}
									{lastMessage.text.substring(0, 50)}
								</p>
							</div>
						</div>
					</Container>
				</li>
			{/if}
		{:else}
			<Container align="center" grow gap={6} justify="center">
				<div class="center">
					<p>No chats</p>
				</div>
			</Container>
		{/each}
	</ul>
{/if}

<style lang="scss">
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
	}

	.chats {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			display: flex;
			align-items: center;
			gap: var(--spacing-12);
			cursor: pointer;
			border-bottom: 1px solid var(--gray20);
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
		color: var(--gray40);
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
