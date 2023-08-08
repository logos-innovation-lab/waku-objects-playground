<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import UserIcon from '$lib/components/icons/user.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'

	import Avatar from '$lib/components/avatar.svelte'
	import { chats, isGroupChatId } from '$lib/stores/chat'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import adapters from '$lib/adapters'
	import { clipAndResize } from '$lib/utils/image'
	import Renew from '$lib/components/icons/renew.svelte'
	import { page } from '$app/stores'
	import type { HDNodeWallet } from 'ethers'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'

	$: chatId = $page.params.id
	$: groupChat = $chats.chats.get(chatId)
	let picture: string | undefined
	let name: string | undefined
	$: if (groupChat) {
		picture = picture ?? groupChat.avatar
		name = name ?? groupChat.name
	}

	let invitedMembers: string[] = []
	let screen: 'settings' | 'invite' = 'settings'
	let pictureFiles: FileList | undefined = undefined
	let buttonDisabled = false

	async function resizePersonaPicture(p?: File) {
		try {
			picture = p ? await adapters.uploadPicture(await clipAndResize(p, 200, 200)) : picture
		} catch (error) {
			console.error(error)
		}
	}
	$: resizePersonaPicture(pictureFiles && pictureFiles[0])

	async function inviteMembers(wallet: HDNodeWallet) {
		buttonDisabled = true

		await adapters.addMemberToGroupChat(chatId, invitedMembers)
		await adapters.sendInvite(wallet, chatId, invitedMembers)

		invitedMembers = []
		buttonDisabled = false

		screen = 'settings'
	}

	function isGroupMember(address: string) {
		return groupChat?.users.map((user) => user.address).includes(address)
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if $chats.loading}
		<Container align="center" grow gap={6} justify="center">
			<h2>Loading...</h2>
		</Container>
	{:else if !groupChat}
		<Container align="center" grow gap={6} justify="center">
			<h2>Could not find group chat.</h2>
		</Container>
	{:else if screen === 'settings'}
		{@const groupMembers = groupChat.users}
		<Header title="Group settings">
			<svelte:fragment slot="left">
				<div class="header-btns">
					<Button variant="icon" on:click={() => history.go(-1)}>
						<ChevronLeft />
					</Button>
				</div>
			</svelte:fragment>
		</Header>
		<Container gap={12}>
			<div class="avatar">
				{#if picture}
					<div class="img">
						<img src={adapters.getPicture(picture)} alt="profile" />
					</div>
				{:else}
					<div class="no-img">
						<div class="profile-default">
							<UserIcon size={70} />
						</div>
					</div>
				{/if}
			</div>
			<InputFile bind:files={pictureFiles}>
				<Renew />
				Change picture
			</InputFile>
			<InputField autofocus bind:value={name} label="Group name" />
		</Container>
		<Container alignItems="center">
			{groupMembers?.length} Members
			<Button disabled={buttonDisabled} on:click={() => (screen = 'invite')}>
				<UserIcon />
				Invite to group
			</Button>
		</Container>
		<ul class="chats" aria-label="Contact List">
			{#each groupMembers as user}
				<li>
					<div class="chat-button" role="listitem">
						<Container grow>
							<div class="chat">
								<Avatar size={70} picture={user.avatar} />
								<div class="content">
									<div class="user-info">
										<span class="username text-lg text-bold">
											{user.name}
										</span>
									</div>
								</div>
							</div>
						</Container>
					</div>
				</li>
			{/each}
		</ul>
	{:else if screen === 'invite'}
		<Header mainContent="right" title="Invite to group">
			<svelte:fragment slot="left">
				<div class="header-btns">
					<Button variant="icon" on:click={() => (screen = 'settings')}>
						<ChevronLeft />
					</Button>
				</div>
			</svelte:fragment>
		</Header>
		<ul class="chats" aria-label="Contact List">
			{#each [...$chats.chats] as [id, chat]}
				{#if !isGroupChatId(id) && !isGroupMember(id)}
					<li>
						<div class="chat-button" role="listitem">
							<Container grow>
								<div class="chat">
									<Avatar size={70} picture={chat.users[0].avatar} />
									<div class="content">
										<div class="user-info">
											<span class="username text-lg text-bold">
												{chat.users[0].name}
											</span>
										</div>
									</div>
									<input type="checkbox" bind:group={invitedMembers} value={id} />
								</div>
							</Container>
						</div>
					</li>
				{/if}
			{/each}
		</ul>

		<Container grow justify="flex-end">
			<Button
				variant="strong"
				disabled={buttonDisabled || invitedMembers.length === 0}
				on:click={() => inviteMembers(wallet)}
			>
				<Checkmark />
				Invite
			</Button>
		</Container>
	{/if}
</AuthenticatedOnly>

<style lang="scss">
	.chats {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			display: flex;
			align-items: center;
			gap: var(--spacing-12);
			border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));

			.chat-button {
				width: 100%;
				cursor: pointer;
			}
		}
	}

	.chat {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-12);
		justify-content: flex-start;
		align-items: flex-start;

		.content {
			flex-grow: 1;
		}
	}

	.user-info {
		margin-bottom: var(--spacing-3);
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: baseline;
		justify-content: space-between;
	}

	.username {
		display: inline-flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
	}

	.avatar {
		margin: var(--spacing-12) auto 0;
		border-radius: 100px;
	}
	.no-img,
	.img {
		aspect-ratio: 1;
		height: 140px;
		border-radius: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--color-step-10, var(--color-dark-step-50));
		margin-inline: auto;
		position: relative;

		:global(img) {
			aspect-ratio: 1;
			object-fit: cover;
			border-radius: 100px;
		}
	}

	.profile-default {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;

		:global(svg) {
			fill: var(--color-step-50, var(--color-dark-step-10));
		}
	}
</style>
