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
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import WakuObject from '$lib/objects/chat.svelte'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import { browser } from '$app/environment'
	import { profile } from '$lib/stores/profile'
	import ChatMessage from '$lib/components/chat-message.svelte'

	let div: HTMLElement
	let autoscroll = true

	beforeUpdate(() => {
		if (browser && window && div) {
			const height = div.scrollHeight
			autoscroll = height <= window.scrollY + window.innerHeight
		}
	})

	afterUpdate(() => {
		if (browser && div && autoscroll) {
			window.scrollTo({
				top: div.scrollHeight,
				behavior: 'smooth',
			})
		}
	})

	onMount(() => {
		if (browser && div) {
			// It can not be done in onMount because the div is not yet rendered
			setTimeout(() => {
				window.scrollTo({
					top: div.scrollHeight,
					behavior: 'auto',
				})
			}, 0)
		}
	})

	$: messages = $chats.chats.get($page.params.id)?.messages || []
	let loading = false
	let text = ''
	$: if (browser && !$walletStore.loading && $walletStore.wallet === undefined) goto(ROUTES.HOME)

	const sendMessage = async () => {
		loading = true
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')
		await adapters.sendChatMessage(wallet, $page.params.id, text)
		text = ''
		loading = false
	}

	$: otherUser = $chats.chats
		.get($page.params.id)
		?.users.find((m) => m.address !== $walletStore.wallet?.address)
</script>

{#if $walletStore.loading || $profile.loading}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $walletStore.error || $profile.error}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Failed to load chat: {$profile.error?.message ?? $walletStore.error?.message}</h2>
	</Container>
{:else}
	<div class="chat">
		<Header>
			<Button variant="icon" slot="left" on:click={() => goto(ROUTES.HOME)}>
				<ChevronLeft />
			</Button>
			<svelte:fragment slot="chat">
				<Avatar picture={otherUser?.avatar ?? ''} />
				{otherUser?.name}
			</svelte:fragment>
		</Header>
		<div class="chat-messages" bind:this={div}>
			<Container>
				<div class="messages">
					<div class="messages-inner">
						<!-- Chat bubbles -->
						{#each messages as message}
							{#if message.type === 'user' && message.text.length > 0}
								<ChatMessage
									myMessage={message.fromAddress === $walletStore.wallet?.address ? true : false}
									bubble
								>
									{message.text}
								</ChatMessage>
							{:else if message.type === 'data'}
								<WakuObject {message} />
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
						<DropdownItem onClick={() => console.log('Pic from Cam')}>Pic from Cam</DropdownItem>
						<DropdownItem onClick={() => console.log('Pic from Lib')}>Pic from Lib</DropdownItem>
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
								sendMessage()
								e.preventDefault()
							}
							// When shift+enter is pressed, add a newline
							if (e.key === 'Enter' && (e.altKey || e.ctrlKey)) {
								text += '\n'
								e.preventDefault()
							}
						}}
					/>
					{#if text.length > 0}
						<Button variant="strong" disabled={loading} on:click={sendMessage}>
							<ArrowUp />
						</Button>
					{/if}
				</div>
			</Container>
		</div>
	</div>
{/if}

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
		min-height: 100dvh;
		min-height: 100vh;
		height: 100%;
		background-color: var(--gray10);
	}

	.chat-messages {
		flex-grow: 1;
		overflow-y: auto;
	}

	.chat-input-wrapper {
		flex-grow: 0;
		position: sticky;
		bottom: 0;
		background-color: var(--white);
		border-top: 1px solid var(--gray20);
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}
</style>
