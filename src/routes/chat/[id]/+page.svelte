<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import WakuObject from '$lib/objects/chat.svelte'

	import { goto } from '$app/navigation'
	import { chats, isGroupChatId } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { browser } from '$app/environment'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import { textToHTML } from '$lib/utils/text'
	import Spacer from '$lib/components/spacer.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import Close from '$lib/components/icons/close.svelte'

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
		if (browser && div) {
			div.scrollTo({
				top: div.scrollHeight,
				behavior: 'auto',
			})
		}

		if (chat?.unread) {
			chats.updateChat($page.params.id, (chat) => ({ ...chat, unread: 0 }))
		}
	})

	$: messages = $chats.chats.get($page.params.id)?.messages || []
	let isSending = false
	let text = ''

	const sendMessage = async (wallet: HDNodeWallet) => {
		isSending = true
		await adapters.sendChatMessage(wallet, $page.params.id, text)
		text = ''
		isSending = false
	}

	function join() {
		chats.updateChat($page.params.id, (chat) => ({ ...chat, joined: true }))
	}

	async function decline() {
		chats.removeChat($page.params.id)
		goto(ROUTES.HOME)
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if !chat}
		<Layout>
			<Container align="center" gap={6} justify="center" padX={24}>
				<h2>Chat not found</h2>
			</Container>
		</Layout>
	{:else}
		{@const otherUser = chat?.users.find((m) => m.address !== wallet.address)}
		<Layout bgColor="shade">
			<svelte:fragment slot="header">
				<Header>
					<Button variant="icon" slot="left" on:click={() => goto(ROUTES.HOME)}>
						<ChevronLeft />
					</Button>
					<svelte:fragment slot="chat">
						<Avatar picture={otherUser?.avatar} seed={otherUser?.address} />
						{otherUser?.name}
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			{#if !chat.joined}
				{@const inviter = chat?.users.find((user) => user.address !== wallet.address)}
				{@const commonGroupNames = Array.from($chats.chats.values())
					.filter(
						(chat) =>
							isGroupChatId(chat.chatId) &&
							chat.users.find((user) => user.address === wallet.address),
					)
					.map((chat) => `"${chat.name}"`)
					.slice(0, 1)}
				<Container justify="center" alignItems="center" gap={0} padX={24}>
					<Avatar picture={inviter?.avatar} seed={inviter?.address} size={140} />
					<Spacer />
					<p class="text-lg text-bold text-center">Chat with "{chat?.name}"?</p>
					<Spacer height={12} />
					<p class="text-lg text-center">
						{chat?.name} invited you to chat privately. {commonGroupNames.length > 0
							? `You are both part of the ${commonGroupNames[0]} group.`
							: ''}
					</p>
					<Spacer />
					<Container direction="row" justify="center" gap={12} alignItems="center" padY={0}>
						<Button align="center" variant="strong" on:click={() => join()}>
							<Checkmark />
							Start chatting
						</Button>
						<Button align="left" on:click={() => decline()}>
							<Close />
							Decline
						</Button>
					</Container>
				</Container>
			{:else}
				<div class="chat-messages" bind:this={div}>
					<Container grow>
						<div class="messages">
							<div class="messages-inner">
								<!-- Chat bubbles -->
								{#each messages as message}
									{#if message.type === 'user' && message.text?.length > 0}
										<ChatMessage
											myMessage={message.fromAddress === wallet.address ? true : false}
											bubble
										>
											{@html textToHTML(message.text)}
										</ChatMessage>
									{:else if message.type === 'data'}
										<WakuObject {message} users={chat.users} />
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
		background-color: var(--color-base, var(--color-dark-accent));
		border-top: 1px solid var(--color-step-20, var(--color-dark-step-40));
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}

	.text-center {
		text-align: center;
	}
</style>
