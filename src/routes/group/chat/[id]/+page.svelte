<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import EditIcon from '$lib/components/icons/edit.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import WakuObject from '$lib/objects/chat.svelte'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { browser } from '$app/environment'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'

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
</script>

<AuthenticatedOnly let:wallet>
	{#if !chat}
		<Container align="center" grow gap={6} justify="center" padX={24}>
			<h2>Chat not found</h2>
		</Container>
	{:else}
		<div class="chat">
			<Header>
				<Button variant="icon" slot="left" on:click={() => goto(ROUTES.HOME)}>
					<ChevronLeft />
				</Button>
				<svelte:fragment slot="chat">
					<Avatar picture={chat?.avatar ?? ''} />
					{chat?.name}
				</svelte:fragment>
				<Button
					variant="icon"
					slot="right"
					on:click={() => goto(ROUTES.GROUP_EDIT($page.params.id))}
				>
					<EditIcon />
				</Button>
			</Header>
			<div class="chat-messages" bind:this={div}>
				<Container grow>
					<div class="messages">
						<div class="messages-inner">
							<!-- Chat bubbles -->
							{#each messages as message}
								{#if message.type === 'user' && message.text.length > 0}
									<ChatMessage
										myMessage={message.fromAddress === wallet.address ? true : false}
										bubble
									>
										{@html message.text.replaceAll('\n', '</br>')}
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
		</div>
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

	.chat {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		height: 100vh;
		background-color: var(--color-step-10, var(--color-dark-step-50));
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
</style>
