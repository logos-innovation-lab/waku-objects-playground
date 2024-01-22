<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount } from 'svelte'
	import { ArrowUp, ChevronLeft, Close, Checkmark, Settings } from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Button from '$lib/components/button.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import ChatMessageComponent from '$lib/components/chat-message.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Spacer from '$lib/components/spacer.svelte'

	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { chats, type ChatMessage, type BabbleMessage } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { browser } from '$app/environment'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import { textToHTML } from '$lib/utils/text'
	import { walletStore } from '$lib/stores/wallet'
	import { formatTimestamp } from '$lib/utils/format'
	import { errorStore } from '$lib/stores/error'
	import Babbles from '$lib/components/icons/babbles.svelte'

	let div: HTMLElement
	let autoscroll = true

	$: chat = $chats.chats.get($page.params.id)
	$: threadId = $page.params.thread_id
	$: chatMessages = $chats.chats.get($page.params.id)?.messages || []
	$: displayMessages = convertMessagesToThreaded(chatMessages)

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
		// It can not be done in onMount because the div is not yet rendered
		setTimeout(() => {
			if (browser && div) {
				div.scrollTo({
					top: div.scrollHeight,
					behavior: 'auto',
				})
			}
		}, 0)

		if (chat?.unread) {
			chats.updateChat($page.params.id, (chat) => ({ ...chat, unread: 0 }))
		}
	})

	let isSending = false
	let text = ''

	const sendMessage = async (wallet: HDNodeWallet) => {
		isSending = true
		try {
			await adapters.sendBabblesMessage($page.params.id, text, threadId)
		} catch (error) {
			console.error({ error })
			errorStore.addEnd({
				title: 'Message Error',
				message: `Failed to send message. ${(error as Error)?.message}`,
				retry: () => sendMessage(wallet),
			})
		}
		text = ''
		isSending = false
	}

	$: wallet = $walletStore.wallet

	function join() {
		chats.updateChat($page.params.id, (chat) => ({ ...chat, joined: true }))
	}

	async function decline() {
		if (wallet?.signingKey.compressedPublicKey) {
			chats.removeChat($page.params.id)
			goto(ROUTES.HOME)
		}
	}

	function htmlize(s: string) {
		const txt = document.createElement('textarea')
		txt.innerHTML = s
		return txt.value
	}

	type ThreadedMessage = BabbleMessage & { level: number }

	function convertMessagesToThreaded(messages: ChatMessage[]): ThreadedMessage[] {
		type ParentMessage = BabbleMessage & { children: ParentMessage[] }

		const roots: ParentMessage[] = []
		const parentMap = new Map<string, ParentMessage>()
		for (const message of messages) {
			if (message.type !== 'babble') {
				continue
			}

			const parent = { ...message, children: [] as ParentMessage[] }
			parentMap.set(message.id, parent)

			if (!message.parentId || threadId === message.id) {
				roots.push(parent)
				continue
			}

			const parentMessage = parentMap.get(message.parentId)
			if (!parentMessage) {
				// this is a workaround for the case when the parent is lost to
				// keep the rest of the thread
				roots.push(parent)
				continue
			}

			parentMessage.children.push(parent)
		}

		function flatten(
			messages: ParentMessage[],
			level = 0,
			threadedMessages: ThreadedMessage[] = [],
		) {
			for (const message of messages) {
				threadedMessages.push({ ...message, level })
				flatten(message.children, level + 1, threadedMessages)
			}
			return threadedMessages
		}

		const threadedMessages = flatten(
			roots.filter((root) => (threadId ? root.id === threadId : root)),
		)

		return threadedMessages
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
					<Button variant="icon" slot="left" on:click={() => history.go(-1)}>
						<ChevronLeft />
					</Button>
					<svelte:fragment slot="chat">
						<Avatar group picture={chat?.avatar} seed={chat?.chatId} />
						<span class="truncate">
							{chat?.name}
						</span>
						<span class="group-icon">
							<Babbles />
						</span>
					</svelte:fragment>
					<svelte:fragment slot="right">
						{#if chat.joined}
							<Button variant="icon" on:click={() => goto(ROUTES.BABBLES_EDIT($page.params.id))}>
								<Settings />
							</Button>
						{/if}
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			{#if !chat.joined}
				<Container justify="center" alignItems="center" gap={0} padX={24}>
					<Avatar group picture={chat?.avatar} seed={chat?.chatId} size={140} />
					<Spacer />
					<p class="text-lg text-bold text-center">Join "{chat?.name}"?</p>
					<Spacer height={12} />
					<Container direction="row" justify="center" gap={12} alignItems="center" padY={0}>
						<Button align="center" variant="strong" on:click={() => join()}>
							<Checkmark />
							Join babbles
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
								{#each displayMessages as message, i}
									{#if message.text?.length > 0}
										{@const sameSender =
											displayMessages[i].senderPublicKey ===
											displayMessages[i - 1]?.senderPublicKey}
										{@const lastMessage =
											i + 1 === displayMessages.length ||
											displayMessages[i].senderPublicKey !==
												displayMessages[i + 1]?.senderPublicKey ||
											displayMessages[i + 1]?.type !== 'babble'}
										<!-- {#if i === 0 || (i > 0 && areDifferentDays(displayMessages[i].timestamp, displayMessages[i - 1].timestamp))}
											<ChatDateBadge text={formatTimestampSeparator(message.timestamp)} />
										{/if} -->
										<ChatMessageComponent
											onClick={() =>
												chat?.chatId && goto(ROUTES.BABBLES_CHAT(chat?.chatId, message.id))}
											leftPadding={message.level}
											myMessage={false}
											bubble
											group
											{sameSender}
											senderName={undefined}
											timestamp={lastMessage
												? formatTimestamp(lastMessage ? message.timestamp : 0)
												: undefined}
										>
											{@html textToHTML(htmlize(message.text))}
										</ChatMessageComponent>
									{/if}
								{/each}
							</div>
						</div>
					</Container>
				</div>
				<div class="chat-input-wrapper">
					<Container>
						<div class="chat-input">
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
		flex-grow: 0;
		position: sticky;
		bottom: 0;
		background-color: var(--color-base, var(--color-dark-accent));
		border-top: 1px solid var(--color-step-20, var(--color-dark-step-40));
		padding-bottom: env(safe-area-inset-bottom);
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}

	.text-center {
		text-align: center;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.group-icon {
		width: 20px;
		height: 20px;
		aspect-ratio: 1;
	}
</style>
