<script lang="ts">
	import NewChat from '$lib/components/icons/add-comment.svelte'
	import Login from '$lib/components/icons/login.svelte'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { profile } from '$lib/stores/profile'
	import { chats } from '$lib/stores/chat'

	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import Avatar from '$lib/components/avatar.svelte'

	import ROUTES from '$lib/routes'
</script>

<div class="content">
	{#if !$profile.address}
		<Container gap={12} justify="center" align="center">
			<div class="chatbot">
				<ChatBot size={32} />
			</div>
			<div>
				<p class="bold">Waku chats</p>
				<p>Connect a web3 wallet to get started</p>
			</div>
			<Button
				disabled={!adapters.canLogIn()}
				on:click={adapters.logIn}
				variant="rounded"
				iconStart={Login}>Connect</Button
			>
		</Container>
	{:else if $chats.loading}
		<Container gap={12} justify="center" align="center">
			<h2>Loading...</h2>
		</Container>
	{:else if $chats.error}
		<Container gap={12} justify="center" align="center">
			<h2>Failed to load chats: {$chats.error.message}</h2>
		</Container>
	{:else}
		<Header>
			<svelte:fragment slot="left">
				<div class="bottom">
					<Button border={false} on:click={() => goto(ROUTES.CHAT_NEW)}>
						<NewChat size={24} />
					</Button>
				</div>
			</svelte:fragment>
			<svelte:fragment slot="right">
				{#if !$profile.address}
					<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><NewChat /></Button>
				{:else}
					<Avatar size={24} picture={$profile.avatar} onClick={() => goto(ROUTES.PROFILE)} />
				{/if}
			</svelte:fragment>
		</Header>
		<Container gap={12} justify="flex-start">
			<ul class="chats">
				{#each [...$chats.chats] as [id, chat]}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<li on:click={() => goto(ROUTES.CHAT(id))}>
						<Avatar />
						<div>
							<!-- TODO: show username or wallet address instead of chat name -->
							<p class="username">{chat.name}<span class="badge">{chat.messages.length}</span></p>
							<p class="message">
								{chat.messages[chat.messages.length - 1]?.text.substring(0, 50)}
							</p>
						</div>
					</li>
				{:else}
					<p>No chats</p>
				{/each}
			</ul>
		</Container>
	{/if}
</div>

<style lang="scss">
	// .bottom {
	// 	display: flex;
	// 	justify-content: flex-end;
	// 	margin: var(--spacing-24) 0px;
	// }
	// .mid {
	// 	flex-grow: 1;
	// }

	.username {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
	}
	.badge {
		background-color: var(--color-body);
		color: var(--color-content-bg);
		padding: 2px 7px;
		border-radius: var(--spacing-12);
		text-align: center;
		font-size: var(--font-size-14);
		font-weight: var(--font-weight-700);
	}

	.chats {
		li {
			border-bottom: 1px solid var(--color-border);
		}
	}

	.bold {
		font-weight: var(--font-weight-600);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--spacing-12);
		cursor: pointer;
	}
</style>
