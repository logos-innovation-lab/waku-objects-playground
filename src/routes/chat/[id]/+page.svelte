<script lang="ts">
	import { beforeUpdate, afterUpdate, onMount, tick } from 'svelte'
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
	import ChatMessage from '$lib/components/chat-message.svelte'

	import WakuObject from '$lib/objects/chat.svelte'

	import { goto } from '$app/navigation'
	import { browser } from '$app/environment'
	import { chats } from '$lib/stores/chat'
	import { profile } from '$lib/stores/profile'
	import { walletStore } from '$lib/stores/wallet'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'

	let div: HTMLElement
	let autoscroll = true

	beforeUpdate(() => {
		autoscroll = div && div.offsetHeight + div.scrollTop > div.scrollHeight - 74
	})

	afterUpdate(() => {
		if (autoscroll) div.scrollTo({ top: div.scrollHeight, behavior: 'smooth' })
	})

	onMount(() => {
		if (browser && div) {
			// It can not be done in onMount because the div is not yet rendered
			setTimeout(() => {
				div.scrollTo({
					top: div.scrollHeight,
					behavior: 'auto',
				})
			}, 0)
		}
	})

	$: messages = $chats.chats.get($page.params.id)?.messages || []

	let loading = false
	let text = ''

	const img = 'https://picsum.photos/500/700'

	$: if (browser && !$walletStore.loading && $walletStore.wallet === undefined) goto(ROUTES.HOME)

	const sendMessage = async () => {
		loading = true
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')
		await adapters.sendChatMessage(wallet, $page.params.id, text)
		text = ''
		loading = false
	}

	$: chat = $chats.chats.get($page.params.id)
	$: otherUser = chat?.users.find((m) => m.address !== $walletStore.wallet?.address)

	function randomIntFromInterval(min: number, max: number) {
		// min and max included
		return Math.floor(Math.random() * (max - min + 1) + min)
	}

	// function isVertical() {
	// 	try {
	// 		// await tick() //waits until the dom has been updated
	// 		// return img.clientHeight >= img.clientWidth
	// 		console.log('done')
	// 		return false
	// 	} catch (error) {
	// 		console.error(error)
	// 	}
	// }
</script>

{#if $walletStore.loading || $profile.loading}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $walletStore.error || $profile.error}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Failed to load chat: {$profile.error?.message ?? $walletStore.error?.message}</h2>
	</Container>
{:else if !chat}
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
				<Avatar picture={otherUser?.avatar ?? ''} />
				{otherUser?.name}
			</svelte:fragment>
		</Header>
		<div class="chat-messages" bind:this={div}>
			<Container grow>
				<div class="messages">
					<div class="messages-inner">
						<!-- Chat bubbles -->
						{#each messages as message}
							{#if message.type === 'user' && message.text.length > 0}
								<div class="message-wrap">
									<!-- TODO: add code to grab images -->
									<div
										class={`img-grid ${
											message.fromAddress === $walletStore.wallet?.address ? 'my-message' : ''
										}`}
									>
										{#each { length: randomIntFromInterval(0, 3) } as _}
											<div>
												<img class={`msg-img`} src={img} alt="message img" />
												<div class="more text-sm">+17</div>
											</div>
										{/each}
									</div>
									<ChatMessage
										myMessage={message.fromAddress === $walletStore.wallet?.address ? true : false}
										bubble
									>
										{@html message.text.replaceAll('\n', '</br>')}
									</ChatMessage>
								</div>
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
								sendMessage()
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
		height: 100dvh;
		height: 100vh;
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

	.message-wrap {
		max-width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		margin-block: var(--spacing-6);
	}

	//The + combinator matches the second element only if it immediately follows the first element.
	// .message-wrap + .message-wrap {
	// 	margin-bottom: var(--spacing-12);
	// }

	.img-grid {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		max-width: 75%;
		justify-content: stretch;

		div {
			// flex-basis: 100%;
			position: relative;

			&:not(:only-child) {
				:global(img) {
					flex-basis: 100%;
					aspect-ratio: 1;
					object-fit: cover;
					position: relative;
					width: 100%;
				}
			}

			&:only-child {
				:global(img) {
					max-width: 300px;
					max-height: 300px;
				}

				// &.vertical {
				// 	width: 80%;
				// }
			}

			.more {
				position: absolute;
				background-color: var(--gray50);
				color: var(--white);
				border-radius: var(--border-radius-sm);
				padding: 3px 6px;
				text-align: center;
				inset: var(--spacing-6) var(--spacing-6) auto auto;
			}
		}

		&.my-message {
			justify-content: flex-end;
			margin-right: 0;
			margin-left: auto;

			> div:only-child :global(img) {
				margin-left: auto;
				margin-right: 0;
			}
		}

		// :global(.msg-img:not(:only-child)) {
		// 	flex-basis: 100%;
		// 	aspect-ratio: 1;
		// 	object-fit: cover;
		// 	position: relative;
		// 	width: 100%;
		// 	// height: 100%;
		// }
	}
</style>
