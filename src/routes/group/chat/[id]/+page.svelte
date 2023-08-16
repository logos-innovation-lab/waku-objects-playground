<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import WakuObject from '$lib/objects/chat.svelte'

	import { goto } from '$app/navigation'
	import { chats, type Chat } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { browser } from '$app/environment'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import Events from '$lib/components/icons/events.svelte'
	import { textToHTML } from '$lib/utils/text'
	import Spacer from '$lib/components/spacer.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import Settings from '$lib/components/icons/settings.svelte'

	let div: HTMLElement
	let autoscroll = true

	beforeUpdate(() => {
		autoscroll = div && div.offsetHeight + div.scrollTop > div.scrollHeight - 74
	})

	afterUpdate(() => {
		if (autoscroll) div.scrollTo({ top: div.scrollHeight, behavior: 'smooth' })
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
	})

	$: messages = $chats.chats.get($page.params.id)?.messages || []
	let loading = false
	let text = ''

	const sendMessage = async (wallet: HDNodeWallet) => {
		loading = true
		await adapters.sendChatMessage(wallet, $page.params.id, text)
		text = ''
		loading = false
	}

	$: chat = $chats.chats.get($page.params.id)

	$: inviter = chat?.users.find((user) => user.address === chat?.inviter)

	function join() {
		chats.update((state) => {
			const newChats = new Map<string, Chat>(state.chats)
			const chat = newChats.get($page.params.id)
			if (chat) {
				chat.joined = true
			}

			return {
				...state,
				chats: newChats,
				loading: false,
			}
		})
	}

	function decline() {
		chats.update((state) => {
			const newChats = new Map<string, Chat>(state.chats)
			newChats.delete($page.params.id)

			return {
				...state,
				chats: newChats,
				loading: false,
			}
		})
		goto(ROUTES.HOME)
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
						<Avatar picture={chat?.avatar ?? ''} />
						{chat?.name}
						<Events />
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
					<Avatar picture={chat?.avatar ?? ''} size={140} />
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
						<!-- THIS BUTTON WILL BE UN-COMMENTED ONCE THE REMOVE CHAT FUNCTIONALITY IS IMPLEMENTED -->
						<!-- <Button align="left" on:click={() => decline()}>
							<Close />
							Decline
						</Button> -->
					</Container>
				</Container>
			{:else}
				<div class="chat-messages" bind:this={div}>
					<Container grow>
						<div class="messages">
							<div class="messages-inner">
								<!-- Chat bubbles -->
								{#each messages as message}
									{#if message.type === 'user' && message.text.length > 0}
										{@const sender = chat.users.find((u) => message.fromAddress === u.address)}
										<ChatMessage
											myMessage={message.fromAddress === wallet.address ? true : false}
											bubble
											group
											sender={message.fromAddress === wallet.address ? undefined : sender?.name}
										>
											{@html textToHTML(message.text)}
											<svelte:fragment slot="avatar">
												{#if message.fromAddress !== wallet.address}
													<Avatar size={40} picture={sender?.avatar} />
												{/if}
											</svelte:fragment>
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
							<Dropdown up left>
								<!-- TODO: make button "active" while dropdown is open -->
								<Button variant="icon" slot="button">
									<Add />
								</Button>
								<DropdownItem disabled onClick={() => console.log('Pic from Cam')}
									>Pic from Cam</DropdownItem
								>
								<DropdownItem disabled onClick={() => console.log('Pic from Lib')}
									>Pic from Lib</DropdownItem
								>
								<DropdownItem onClick={() => goto(ROUTES.OBJECTS($page.params.id))}
									>Waku Object</DropdownItem
								>
							</Dropdown>
							<Textarea
								placeholder="Message"
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
								<Button variant="strong" disabled={loading} on:click={() => sendMessage(wallet)}>
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
