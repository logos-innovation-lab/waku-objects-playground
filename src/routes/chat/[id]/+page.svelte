<script lang="ts">
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import Edit from '$lib/components/icons/edit.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import SendAltFilled from '$lib/components/icons/send-alt-filled.svelte'
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
	let object = true

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
		<Header title="Chat">
			<Button
				slot="left"
				icon={ArrowLeft}
				border={false}
				variant="nopad"
				on:click={() => goto(ROUTES.HOME)}
			/>
		</Header>
		<div class="chat-messages">
			<Container>
				<div class="messages">
					<div class="messages-inner">
						<!-- Chat bubbles -->
						{#each messages as message}
							{#if message.text.length > 0}
								<div
									class={`message ${
										message.fromAddress !== $profile.address ? 'their-message' : ''
									}`}
								>
									<div class="message-content">
										<div class="message-text">{message.text}</div>
									</div>
								</div>
							{/if}
						{/each}
						{#if object}
							<div class={`message their-message`}>
								<div class="message-content">
									<div class="message-text message-object-request">
										<div class="req-title">Requestd transaction</div>
										<div class="req-amt">0.00057 ETH</div>
										<div class="req-converted">Approx. 50 USD</div>
										<div class="req-status">pending</div>
										<Button icon={Checkmark} justify="left">Pay now</Button>
									</div>
								</div>
							</div>
							<div class={`message`}>
								<div class="message-content">
									<div class="message-text message-object-request">
										<div class="req-title">Requestd transaction</div>
										<div class="req-amt">0.00057 ETH</div>
										<div class="req-converted">Approx. 50 USD</div>
										<div class="req-status">pending</div>
										<Button icon={Edit} justify="right">Edit</Button>
									</div>
								</div>
							</div>

							<div class={`message their-message`}>
								<div class="message-content">
									<div class="message-text message-object-confirmation">
										<div class="conf-link">Requested transaction 0.00057 ETH</div>
										<div class="conf-status">Transaction confirmed</div>
									</div>
								</div>
							</div>
							<div class={`message`}>
								<div class="message-content">
									<div class="message-text message-object-confirmation">
										<div class="conf-link">Requested transaction 0.00057 ETH</div>
										<div class="conf-status">Transaction confirmed</div>
									</div>
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
	<Header title="Waku Objects">
		<Button
			slot="left"
			icon={ArrowLeft}
			border={false}
			variant="nopad"
			on:click={() => (state = 'chat')}
		/>
	</Header>
	<Container gap={12}>
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
		// margin-bottom: 96px;
		flex-grow: 50;
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
		margin-bottom: var(--spacing-24);
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
		border-radius: var(--spacing-24);
		border-bottom-right-radius: 0;
		display: inline-block;
		font-family: var(--font-serif);
		font-size: var(--font-size-20);
		background-color: var(--color-grey-bg);
		border: 1px solid var(--color-grey-bg);
	}

	.their-message {
		align-items: flex-start;
		text-align: left;

		.message-content {
			text-align: left;
		}

		.message-text {
			border-bottom-right-radius: var(--spacing-24);
			border-bottom-left-radius: 0;
			border: 1px solid var(--color-border);
			background-color: transparent;
		}
	}

	.message-object-request {
		font-size: var(--font-size-14);
		.req-title {
			margin-bottom: var(--spacing-12);
		}
		.req-amt {
			font-size: var(--font-size-20);
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
		font-size: var(--font-size-14);

		.conf-link {
			font-style: italic;
			color: var(--color-border);
			text-decoration: underline;
			margin-bottom: var(--spacing-12);
			cursor: pointer;
		}
	}

	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chat-messages {
		flex-grow: 1;
		overflow-y: auto;
	}

	.chat-input-wrapper {
		flex-grow: 0;
		// position: absolute;
		// inset: auto 0 0;
		position: sticky;
		bottom: 0;
		background-color: var(--color-content-bg);
		border-top: 1px solid var(--color-border);
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}
</style>
