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
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { browser } from '$app/environment'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import { textToHTML } from '$lib/utils/text'

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
						<Avatar picture={otherUser?.avatar ?? ''} />
						{otherUser?.name}
					</svelte:fragment>
				</Header>
			</svelte:fragment>
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
			<svelte:fragment slot="footer">
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
			</svelte:fragment>
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
</style>
