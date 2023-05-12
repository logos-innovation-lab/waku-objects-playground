<script lang="ts">
	import NewChat from '$lib/components/icons/add-comment.svelte'
	import Login from '$lib/components/icons/login.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	// import Search from '$lib/components/icons/search.svelte'

	import Container from '$lib/components/container.svelte'
	import Badge from '$lib/components/badge.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { profile } from '$lib/stores/profile'
	import { chats } from '$lib/stores/chat'
	import { formatDateAndTime } from '$lib/utils/format'
	import { formatAddress } from '$lib/utils/format'

	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import Avatar from '$lib/components/avatar.svelte'

	import ROUTES from '$lib/routes'
</script>

<div class="content">
	{#if !$profile.address}
		<Container>
			<div class="loggedout">
				<div class="chatbot">
					<ChatBot size={32} />
				</div>
				<p class="text-lg text-bold">Waku chats</p>
				<div class="btn-connect">
					<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn} iconStart={Login}
						>Connect</Button
					>
				</div>
			</div>
		</Container>
	{:else if $chats.loading}
		<Container>
			<h2>Loading...</h2>
		</Container>
	{:else if $chats.error}
		<Container>
			<h2>Failed to load chats: {$chats.error.message}</h2>
		</Container>
	{:else}
		<Header search>
			<svelte:fragment slot="left">
				<div class="header-btns">
					<Button variant="icon" on:click={() => goto(ROUTES.CHAT_NEW)}>
						<NewChat size={24} />
					</Button>
				</div>
			</svelte:fragment>
			<svelte:fragment slot="right">
				{#if !$profile.address}
					<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><NewChat /></Button>
				{:else}
					<Button variant="account" on:click={() => goto(ROUTES.PROFILE)}>
						<svelte:fragment slot="avatar">
							<Avatar size={48} picture={$profile.avatar} />
						</svelte:fragment>
						{$profile.name ? $profile.name : formatAddress($profile.address)}
					</Button>
				{/if}
			</svelte:fragment>
		</Header>
		<ul class="chats">
			{#each [...$chats.chats] as [id, chat]}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li on:click={() => goto(ROUTES.CHAT(id))}>
					<Container>
						<div class="chat">
							<Avatar size={70} />
							<div class="content">
								<div class="user-info">
									<!-- TODO: show username or wallet address instead of chat name -->
									<span class="username text-large text-bold">
										{chat.name ? chat.name : 'Unnamed chat'}
										<Badge dark>
											{chat.messages.length}
										</Badge>
									</span>
									<span class="timestamp">
										{formatDateAndTime(chat.messages[chat.messages.length - 1].timestamp)}
									</span>
								</div>
								<p class="message text-serif">
									{chat.messages[chat.messages.length - 1]?.text.substring(0, 50)}
								</p>
							</div>
						</div>
					</Container>
				</li>
			{:else}
				<p>No chats</p>
			{/each}
		</ul>
	{/if}
</div>

<style lang="scss">
	.loggedout {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		place-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;

		.btn-connect {
			margin-top: var(--spacing-6);
		}
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
		padding-block: var(--spacing-12);

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
</style>
