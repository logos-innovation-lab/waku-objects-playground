<script lang="ts">
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import Menu from '$lib/components/icons/overflow-menu-horizontal.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Textarea from '$lib/components/textarea.svelte'
	import Card from '$lib/components/card.svelte'
	import Button from '$lib/components/button.svelte'

	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'

	import { goto } from '$app/navigation'
	import { profile } from '$lib/stores/profile'
	import { chats } from '$lib/stores/chat'
	import SendAltFilled from '$lib/components/icons/send-alt-filled.svelte'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'

	const cards = [
		{
			image: '',
			title: 'Request transaction',
			description: 'Receive funds from anyone in the chat to your wallet.',
			onClick: () => goto(ROUTES.REQUEST_TRANSACTION),
		},
		{
			image: '',
			title: 'Send transaction',
			description: 'Send funds to anyone in the chat from your wallet.',
			onClick: () => goto(ROUTES.SEND_TRANSACTION),
		},
	]

	let state: 'waku' | 'chat' = 'chat'
	$: messages = $chats.chats.get($page.params.id)?.messages || []
	let loading = false
	let text = ''
	$: if ($profile.address === undefined) goto(ROUTES.HOME)

	const sendMessage = async () => {
		loading = true
		await adapters.sendChatMessage($page.params.id, text)
		text = ''
		loading = false
	}
</script>

{#if state === 'chat'}
	<div class="chat">
		<div class="chat-messages">
			<Container>
				<Header title="Chat">
					<Button
						slot="left"
						icon={ArrowLeft}
						border={false}
						variant="nopad"
						on:click={() => goto(ROUTES.HOME)}
					/>
				</Header>
				<div class="messages">
					<div class="messages-inner">
						<!-- Chat bubbles -->
						{#each messages as message}
							<div
								class={`message ${message.fromAddress !== $profile.address ? 'their-message' : ''}`}
							>
								<div class="message-content">
									<div class="message-text">{message.text}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Container>
		</div>
		<div class="chat-input-wrapper">
			<Container>
				<div class="chat-input">
					<Dropdown up>
						<Button slot="button" icon={Add} variant="rounded" />
						<DropdownItem onClick={() => console.log('Pic from Cam')}>Pic from Cam</DropdownItem>
						<DropdownItem onClick={() => console.log('Pic from Lib')}>Pic from Lib</DropdownItem>
						<DropdownItem onClick={() => (state = 'waku')}>Waku Object</DropdownItem>
					</Dropdown>
					<Textarea placeholder="Say something" bind:value={text} pad={24} />
					<Button variant="nopad" border={false} disabled={loading} on:click={sendMessage}
						><SendAltFilled /></Button
					>
				</div>
			</Container>
		</div>
	</div>
{:else if state === 'waku'}
	<Container gap={12}>
		<Header title="Waku Objects">
			<Button
				slot="left"
				icon={ArrowLeft}
				border={false}
				variant="nopad"
				on:click={() => (state = 'chat')}
			/>
		</Header>
		{#each cards as card}
			<Card {...card}>
				<svelte:fragment slot="menu">
					<Dropdown>
						<Button slot="button" icon={Menu} variant="nopad" border={false} />
						<DropdownItem onClick={() => console.log('View more info')}>View more info</DropdownItem
						>
						<DropdownItem onClick={() => console.log('Uninstall')}>Uninstall</DropdownItem>
					</Dropdown>
				</svelte:fragment>
			</Card>
		{/each}

		<Button icon={Add}>Add Waku Object</Button>
	</Container>
{/if}

<style lang="scss">
	.messages {
		margin-bottom: 96px;
		flex-grow: 1;
	}
	.messages-inner {
		padding-top: var(--spacing-48);
	}

	.message {
		display: flex;
		gap: var(--spacing-6);
		flex-direction: column;
		align-items: flex-end;
		margin-bottom: var(--spacing-24);
	}
	.message-content {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: flex-end;
	}

	.message-text {
		padding: var(--spacing-12);
		border-radius: var(--spacing-24);
		border-bottom-right-radius: 0;
		display: inline-block;
		font-family: var(--font-serif);
		font-size: var(--font-size-lg);
		background-color: var(--color-grey-bg);
		border: 1px solid var(--color-grey-bg);
	}

	.their-message {
		align-items: flex-start;

		.message-text {
			border-bottom-right-radius: var(--spacing-24);
			border: 1px solid var(--color-border);
			background-color: transparent;
		}
	}

	.chat {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.chat-messages {
		flex-grow: 1;
	}

	.chat-input-wrapper {
		flex-grow: 0;
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}
</style>
