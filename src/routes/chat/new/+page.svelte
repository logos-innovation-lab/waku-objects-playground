<script lang="ts">
	import { page } from '$app/stores'

	import Add from '$lib/components/icons/add.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import ArrowUp from '$lib/components/icons/arrow-up.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'

	import { profile } from '$lib/stores/profile'
	import { contacts } from '$lib/stores/users'

	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import Avatar from '$lib/components/avatar.svelte'

	import ROUTES from '$lib/routes'
	import Textarea from '$lib/components/textarea.svelte'
	import type { DraftChat } from '$lib/stores/chat'
	import { walletStore } from '$lib/stores/wallet'

	// Not logged in users should be redirected to home page
	$: if (!$walletStore.wallet) goto(ROUTES.HOME)

	let participants: string[] = []
	let chatName = ''
	let loading = false
	let state: 'edit-participants' | 'edit-name' | 'send-message' = 'edit-participants'
	let myAddress: string | undefined = undefined
	$: $walletStore.wallet?.getAddress().then((a) => (myAddress = a))

	const startChat = async () => {
		const wallet = $walletStore.wallet
		if (participants.length === 0 || !wallet) return
		loading = true
		const chat: DraftChat = {
			name: chatName,
			users: [...participants, await wallet.getAddress()],
			messages: [],
		}
		const chatId = await adapters.startChat(wallet, chat)
		loading = false
		goto(ROUTES.CHAT(chatId))
	}

	let text = ''
	$: if ($walletStore.wallet === undefined) goto(ROUTES.HOME)

	const sendMessage = async () => {
		loading = true
		const wallet = $walletStore.wallet
		if (!wallet) return
		await adapters.sendChatMessage(wallet, $page.params.id, text)
		text = ''
		loading = false
	}
</script>

{#if state === 'edit-participants'}
	<Header title="New chat">
		<Button variant="icon" slot="left" on:click={() => goto(ROUTES.HOME)}>
			<ChevronLeft />
		</Button>
		<svelte:fragment slot="right">
			<Avatar picture={$profile.avatar} onClick={() => goto(ROUTES.IDENTITY)} />
		</svelte:fragment>
	</Header>
	<Container gap={12}>
		<p class="text-lg text-bold">Chat participants</p>
		<ul>
			{#each participants as participant}
				{@const contact = $contacts.contacts.get(participant)}
				{#if contact}
					<li>
						<div>
							<Button
								on:click={() => (participants = participants.filter((p) => p !== participant))}
							>
								<Close />
							</Button>
						</div>
						<Avatar picture={contact.avatar} />{contact.name ?? contact.address}
					</li>
				{/if}
			{:else}
				<p>No participants, please select at least one</p>
			{/each}
		</ul>
	</Container>
	<Divider pad={12} />
	<Container grow gap={12}>
		<p class="text-lg text-bold">Contact list</p>
		<span>(for now this is all registered users)</span>
		<ul>
			{#each [...$contacts.contacts].filter(async ([address]) => !participants.includes(address) && address !== myAddress) as [address, contact]}
				<li>
					<div>
						<Button on:click={() => (participants = [...participants, address])}>
							<Add />
						</Button>
					</div>
					<Avatar picture={contact.avatar} />{contact.name ?? contact.address}
				</li>
			{/each}
		</ul>
	</Container>
	<Container sticky="bottom" align="center">
		<Button
			disabled={participants.length === 0}
			on:click={() => {
				state = participants.length > 1 ? 'edit-name' : 'send-message'
			}}
		>
			<ArrowRight /> Next
		</Button>
	</Container>
{:else if state === 'edit-name'}
	<Header title="New chat">
		<Button slot="left" on:click={() => (state = 'edit-participants')}>
			<ArrowLeft />
		</Button>
		<svelte:fragment slot="right">
			<Avatar picture={$profile.avatar} onClick={() => goto(ROUTES.IDENTITY)} />
		</svelte:fragment>
	</Header>
	<Container grow justify="center" align="center" gap={24}>
		<p class="text-lg text-bold">Please name your group chat</p>
		<Textarea label="Chat name" bind:value={chatName} />
	</Container>
	<Container sticky="bottom" align="center">
		<Button disabled={chatName === ''} on:click={() => (state = 'send-message')}>
			<ArrowRight /> Next
		</Button>
	</Container>
{:else if state === 'send-message'}
	<Header
		title={participants.length > 1
			? chatName
			: $contacts.contacts.get(participants[0])?.name ??
			  $contacts.contacts.get(participants[0])?.address}
	>
		<Button slot="left" on:click={() => (state = 'edit-participants')}>
			<ArrowLeft />
		</Button>
		<svelte:fragment slot="right">
			<Avatar picture={$profile.avatar} onClick={() => goto(ROUTES.IDENTITY)} />
		</svelte:fragment>
	</Header>
	<div class="bg">
		<Container grow>
			<h2>{chatName}</h2>
			<p>This is the very beginning of your conversation between you and</p>
			{#each participants as participant}
				{@const contact = $contacts.contacts.get(participant)}
				{#if contact}
					<li>
						<Avatar picture={contact.avatar} />{contact.name ?? contact.address}
					</li>
				{/if}
			{/each}
		</Container>
	</div>
	<Container sticky="bottom" direction="row" gap={6} align="center">
		<Dropdown up>
			<Button variant="icon" slot="button">
				<Add />
			</Button>
			<DropdownItem onClick={() => console.log('Pic from Cam')}>Pic from Cam</DropdownItem>
			<DropdownItem onClick={() => console.log('Pic from Lib')}>Pic from Lib</DropdownItem>
			<DropdownItem onClick={() => console.log('waku object')}>Waku Object</DropdownItem>
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
			<Button variant="strong" disabled={loading} on:click={startChat}>
				<ArrowUp />
			</Button>
		{/if}
	</Container>
{/if}

<style lang="scss">
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--spacing-12);
		margin-block: var(--spacing-12);
	}
	.bg {
		flex-grow: 1;
		background-color: var(--gray10);
	}
</style>
