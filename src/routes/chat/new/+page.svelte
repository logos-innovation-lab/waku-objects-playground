<script lang="ts">
	import Add from '$lib/components/icons/add.svelte'
	import Wallet from '$lib/components/icons/wallet.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { profile } from '$lib/stores/profile'
	import { contacts } from '$lib/stores/users'

	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import Avatar from '$lib/components/avatar.svelte'

	import ROUTES from '$lib/routes'
	import Textarea from '$lib/components/textarea.svelte'
	import SendAltFilled from '$lib/components/icons/send-alt-filled.svelte'
	import type { DraftChat } from '$lib/stores/chat'

	// Not logged in users should be redirected to home page
	$: if (!$profile.address) goto(ROUTES.HOME)

	let participants: string[] = []
	let chatName = ''
	let loading = false
	let state: 'edit-participants' | 'edit-name' | 'send-message' = 'edit-participants'

	const startChat = async () => {
		if (participants.length === 0 || !$profile.address) return
		loading = true
		const chat: DraftChat = {
			name: chatName,
			users: [...participants, $profile.address],
			messages: [],
		}
		const chatId = await adapters.startChat(chat)
		loading = false
		goto(ROUTES.CHAT(chatId))
	}
</script>

{#if state === 'edit-participants'}
	<Header title="New chat">
		<Button
			slot="left"
			icon={ArrowLeft}
			border={false}
			variant="nopad"
			on:click={() => goto(ROUTES.HOME)}
		/>
		<svelte:fragment slot="right">
			{#if !$profile.address}
				<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
			{:else}
				<Avatar picture={$profile.avatar} onClick={() => goto('/profile')} />
			{/if}
		</svelte:fragment>
	</Header>
	<div class="content">
		<Container gap={12}>
			<div class="mid">
				<section>
					<h2>Chat participants</h2>
					<ul>
						{#each participants as participant}
							{@const contact = $contacts.contacts.get(participant)}
							{#if contact}
								<li>
									<div class="nogrow">
										<Button
											variant="rounded"
											border={false}
											icon={Close}
											on:click={() =>
												(participants = participants.filter((p) => p !== participant))}
										/>
									</div>
									<Avatar picture={contact.avatar} />{contact.name ?? contact.address}
								</li>
							{/if}
						{:else}
							<p>No participants, please select at least one</p>
						{/each}
					</ul>
				</section>

				<section>
					<h2>Contact list</h2>
					<span>(for now this is all registered users)</span>
					<ul>
						{#each [...$contacts.contacts].filter(([address]) => !participants.includes(address) && address !== $profile.address) as [address, contact]}
							<li>
								<div class="nogrow">
									<Button
										variant="rounded"
										border={false}
										icon={Add}
										on:click={() => (participants = [...participants, address])}
									/>
								</div>
								<Avatar picture={contact.avatar} />{contact.name ?? contact.address}
							</li>
						{/each}
					</ul>
				</section>
			</div>

			<div class="bottom">
				<Button
					variant="rounded"
					disabled={participants.length === 0}
					on:click={() => {
						state = participants.length > 1 ? 'edit-name' : 'send-message'
					}}
				>
					<ArrowRight /> Next
				</Button>
			</div>
		</Container>
	</div>
{:else if state === 'edit-name'}
	<Header title="New chat">
		<Button
			slot="left"
			icon={ArrowLeft}
			border={false}
			variant="nopad"
			on:click={() => (state = 'edit-participants')}
		/>
		<svelte:fragment slot="right">
			{#if !$profile.address}
				<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
			{:else}
				<Avatar picture={$profile.avatar} onClick={() => goto('/profile')} />
			{/if}
		</svelte:fragment>
	</Header>
	<Container gap={12}>
		<div class="mid">
			<p>Please name your group chat</p>
			<Textarea label="Chat name" bind:value={chatName} />
		</div>

		<div class="bottom">
			<Button
				variant="rounded"
				disabled={chatName === ''}
				on:click={() => (state = 'send-message')}
			>
				<ArrowRight /> Next
			</Button>
		</div>
	</Container>
{:else if state === 'send-message'}
	<Header title="New chat">
		<Button
			slot="left"
			icon={ArrowLeft}
			border={false}
			variant="nopad"
			on:click={() => (state = 'edit-participants')}
		/>
		<svelte:fragment slot="right">
			{#if !$profile.address}
				<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
			{:else}
				<Avatar picture={$profile.avatar} onClick={() => goto('/profile')} />
			{/if}
		</svelte:fragment>
	</Header>
	<Container gap={12}>
		<div class="mid">
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
		</div>
		<div class="bottom">
			<Textarea placeholder="Say something" />
			<Button variant="rounded" border={false} disabled={loading} on:click={startChat}
				><SendAltFilled /></Button
			>
		</div>
	</Container>
{/if}

<style lang="scss">
	.bottom {
		display: flex;
		justify-content: flex-end;
		margin: var(--spacing-24) 0px;
	}
	// .mid {
	// 	flex-grow: 1;
	// }
	section {
		margin: var(--spacing-24) 0px;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--spacing-12);
	}
	.nogrow {
		flex-grow: 0;
	}
</style>
