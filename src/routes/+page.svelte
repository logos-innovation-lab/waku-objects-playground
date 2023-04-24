<script lang="ts">
	import Add from '$lib/components/icons/add.svelte'
	import Wallet from '$lib/components/icons/wallet.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { profile } from '$lib/stores/profile'
	import { chats } from '$lib/stores/chat'
	import { contacts } from '$lib/stores/users'

	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
	import Avatar from '$lib/components/avatar.svelte'
</script>

<Container gap={12}>
	<Header>
		<h1>WO Playground</h1>
		<svelte:fragment slot="right">
			{#if !$profile.address}
				<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
			{:else}
				<Avatar picture={$profile.avatar} onClick={() => goto('/profile')} />
			{/if}
		</svelte:fragment>
	</Header>

	<div class="mid">
		{#if !$profile.address}
			<h2>Connect your wallet</h2>
			<p>To use Waku Objects, you need to access your account by connecting your wallet.</p>
			<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
		{:else if $chats.loading}
			<h2>Loading...</h2>
		{:else if $chats.error}
			<h2>Failed to load chats: {$chats.error.message}</h2>
		{:else}
			<h2>Chats</h2>
			{#each [...$chats.chats] as chat}
				{JSON.stringify(chat)}
			{:else}
				<p>No chats</p>
			{/each}
			<h2>Contacts</h2>
			<ul>
				{#each [...$contacts.contacts] as contact}
					<li><pre>{contact[0]}</pre></li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="bottom">
		<Button variant="rounded">
			<Add /> New chat
		</Button>
	</div>
</Container>

<style lang="scss">
	.bottom {
		display: flex;
		justify-content: flex-end;
		margin: var(--spacing-24) 0px;
	}
	.mid {
		flex-grow: 1;
	}
</style>
