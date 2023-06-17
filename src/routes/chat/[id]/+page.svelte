<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ChevronRight from '$lib/components/icons/chevron-right.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import WakuObject from '$lib/objects/waku-object.svelte'
	import { HELLO_WORLD_OBJECT_ID } from '$lib/objects/hello-world'

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

	const objects = [
		{
			image: 'https://picsum.photos/200',
			title: 'Request transaction',
			description: 'Request a transaction in the chat to your prefered wallet',
			onClick: () => goto(ROUTES.REQUEST_TRANSACTION),
		},
		{
			image: 'https://picsum.photos/200',
			title: 'Send transaction',
			description: 'Send funds to anyone in the chat from your wallet.',
			onClick: () => goto(ROUTES.SEND_TRANSACTION),
		},
		{
			image: 'https://picsum.photos/200',
			title: 'Hello World',
			description: 'Say hello',
			onClick: () => {
				state = 'chat'
				createObject(HELLO_WORLD_OBJECT_ID, {
					/* TODO empty */
				})
			},
		},
	]

	let state: 'waku' | 'chat' = 'chat'
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

	const createObject = async <T>(objectId: string, t: T) => {
		// TODO random
		const genRanHex = (size: number) =>
			[...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
		const instanceId = genRanHex(12)
		await sendData(objectId, instanceId, t)
	}

	const sendData = async (objectId: string, instanceId: string, data: unknown) => {
		loading = true
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')
		await adapters.sendData(wallet, $page.params.id, objectId, instanceId, data)
		text = ''
		loading = false
	}

	let chatImg: string | undefined = undefined
	if ($chats.chats.get($page.params.id)?.users.length === 2) {
		$chats.chats.get($page.params.id)?.users.forEach((member) => {
			if (member.address !== $walletStore.wallet?.address) {
				chatImg = member.avatar
			}
		})
	}
</script>

{#if $walletStore.loading || $profile.loading}
	<Container align="center" grow gap={6} justify="center" pad={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $walletStore.error || $profile.error}
	<Container align="center" grow gap={6} justify="center" pad={24}>
		<h2>Failed to load chat: {$profile.error?.message ?? $walletStore.error?.message}</h2>
	</Container>
{:else if state === 'chat'}
	<div class="chat">
		<Header>
			<Button variant="icon" slot="left" on:click={() => goto(ROUTES.HOME)}>
				<ChevronLeft />
			</Button>
			<svelte:fragment slot="chat">
				<Avatar picture={chatImg ? chatImg : ''} />
				{$chats.chats.get($page.params.id)?.name}
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
						<DropdownItem onClick={() => (state = 'waku')}>Waku Object</DropdownItem>
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
{:else if state === 'waku'}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<Header mainContent="left">
		<svelte:fragment slot="left">
			<div class="gray">
				<ArrowUp /> to {$chats.chats.get($page.params.id)?.name}
			</div>
		</svelte:fragment>
		<svelte:fragment slot="right">
			<Button variant="icon" on:click={() => (state = 'chat')}>
				<Close />
			</Button>
		</svelte:fragment>
	</Header>
	<div bind:this={div}>
		{#each objects as object}
			<div class="object" {...object}>
				<Container direction="row" gap={12} alignItems="center">
					<img class="img" src={object.image} alt="object logo" />
					<p>
						<span class="text-bold text-lg">{object.title}</span>
						{object.description}
					</p>
					<Button variant="icon" on:click={object.onClick}>
						<ChevronRight />
					</Button>
				</Container>
			</div>
		{/each}
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
	.object {
		padding: var(--spacing-12) 0 var(--spacing-12) var(--spacing-12);
		border-bottom: var(--border);

		.img {
			width: 70px;
		}
		img {
			width: 70px;
			height: 70px;
			aspect-ratio: 1;
			border-radius: 18px;
		}
		span {
			display: block;
			margin-bottom: var(--spacing-6);
		}
		p {
			flex-grow: 1;
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
		// border: 1px solid var(--gray10);
	}

	.their-message {
		align-items: flex-start;
		text-align: left;

		.message-content {
			text-align: left;
		}

		// .message-text {
		// border-bottom-right-radius: var(--spacing-24);
		// border-bottom-left-radius: 0;
		// border: 1px solid var(--gray20);
	}
	// }

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
