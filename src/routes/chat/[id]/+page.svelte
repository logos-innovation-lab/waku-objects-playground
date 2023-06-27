<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import WakuObject from '$lib/objects/waku-object.svelte'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import { browser } from '$app/environment'
	import { profile } from '$lib/stores/profile'

	let div: HTMLElement
	let autoscroll = true

	beforeUpdate(() => {
		autoscroll = div && div.offsetHeight + div.scrollTop > div.scrollHeight - 20
	})

	afterUpdate(() => {
		if (autoscroll) div && div.scrollTo(0, div.scrollHeight)
	})

	onMount(() => {
		div && div.scrollTo(0, div.scrollHeight)
	})

	let object = false

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
								<div
									class={`message ${
										message.fromAddress !== $walletStore.wallet?.address
											? 'their-message'
											: 'my-message'
									}`}
								>
									<div class="message-content message-text text-lg">
										{message.text}
									</div>
								</div>
							{:else if message.type === 'data'}
								<WakuObject {message} />
							{/if}
						{/each}
						{#if object}
							<div class={`message their-message`}>
								<div class="message-content message-text text-lg message-object-request">
									<div class="req-title">Requestd transaction</div>
									<div class="req-amt">0.00057 ETH</div>
									<div class="req-converted">Approx. 50 USD</div>
									<div class="req-status">pending</div>
									<Button><Checkmark />Pay now</Button>
								</div>
							</div>
							<div class={`message`}>
								<div class="message-content message-text text-lg message-object-request">
									<div class="req-title">Requestd transaction</div>
									<div class="req-amt">0.00057 ETH</div>
									<div class="req-converted">Approx. 50 USD</div>
									<div class="req-status">pending</div>
									<Button><Edit />Edit</Button>
								</div>
							</div>

							<div class={`message their-message`}>
								<div class="message-content message-text text-lg message-object-confirmation">
									<div class="conf-link">Requested transaction 0.00057 ETH</div>
									<div class="conf-status">Transaction confirmed</div>
								</div>
							</div>
							<div class={`message`}>
								<div class="message-content message-text text-lg message-object-confirmation">
									<div class="conf-link">Requested transaction 0.00057 ETH</div>
									<div class="conf-status">Transaction confirmed</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</Container>
		</div>
		<div class="chat-input-wrapper">
			<Container>
				<div class="chat-input">
					<Dropdown up>
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
	.gray {
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
		color: var(--gray40);
		font-weight: var(--font-weight-500);
		:global(svg) {
			fill: var(--gray40);
		}
	}
	.messages {
		flex-grow: 1;
	}
	.messages-inner {
		padding-top: var(--spacing-48);
		overflow-y: auto;
	}

	.message {
		display: flex;
		gap: var(--spacing-6);
		flex-direction: column;
		align-items: flex-end;
		max-width: 75%;
		margin-right: auto;
		margin-left: 0;
		&:not(:last-child) {
			margin-bottom: var(--spacing-12);
		}

		&.my-message {
			font-style: italic;
			margin-left: auto;
			margin-right: 0;
		}
	}
	.message-content {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: flex-end;
		text-align: right;
	}

	.message-text {
		padding: var(--spacing-12);
		border-radius: var(--border-radius);
		display: inline-block;
		font-family: var(--font-serif);
		background-color: var(--white);
	}

	.their-message {
		align-items: flex-start;
		text-align: left;

		.message-content {
			text-align: left;
		}
	}

	.message-object-request {
		font-size: var(--font-size-sm);
		.req-title {
			margin-bottom: var(--spacing-12);
		}
		.req-amt {
			font-size: var(--font-size-xl);
			font-weight: var(--font-weight-600);
		}
		.req-converted {
			margin-bottom: var(--spacing-12);
		}
		.req-status {
			display: inline-block;
			background-color: #d8d8d8;
			border-radius: 21px;
			text-transform: uppercase;
			font-size: 10px;
			padding: var(--spacing-6);
			margin-bottom: var(--spacing-12);
		}
	}

	.message-object-confirmation {
		font-size: var(--font-size-sm);

		.conf-link {
			font-style: italic;
			color: var(--gray20);
			text-decoration: underline;
			margin-bottom: var(--spacing-12);
			cursor: pointer;
		}
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
