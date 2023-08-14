<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import UserIcon from '$lib/components/icons/user.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import AddComment from '$lib/components/icons/add-comment.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Checkbox from '$lib/components/checkbox.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import InputFile from '$lib/components/input-file.svelte'

	import { chats, isGroupChatId } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import { clipAndResize } from '$lib/utils/image'
	import { page } from '$app/stores'
	import type { HDNodeWallet } from 'ethers'
	import routes from '$lib/routes'
	import { goto } from '$app/navigation'
	import ChatBot from '$lib/components/icons/chat-bot.svelte'
	import { getPicture, uploadPicture } from '$lib/adapters/ipfs'

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
			picture = p ? await uploadPicture(await clipAndResize(p, 200, 200)) : picture
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
		<Layout>
			<Container align="center" grow gap={6} justify="center">
				<h2>Loading...</h2>
			</Container>
		</Layout>
	{:else if !groupChat}
		<Layout>
			<Container align="center" grow gap={6} justify="center">
				<h2>Could not find group chat.</h2>
			</Container>
		</Layout>
	{:else if screen === 'settings'}
		{@const groupMembers = groupChat.users}
		<Layout>
			<svelte:fragment slot="header">
				<Header title="Group settings">
					<svelte:fragment slot="left">
						<div class="header-btns">
							<Button variant="icon" on:click={() => history.go(-1)}>
								<ChevronLeft />
							</Button>
						</div>
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			<Container gap={12}>
				<div class="avatar">
					{#if picture}
						<div class="img">
							<img src={getPicture(picture)} alt="profile" />
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
			<Divider padTop={24} />
			<Container gap={12} alignItems="center" padY={24}>
				<p class="text-bold text-lg">
					{groupMembers?.length} Members
				</p>
				<Button disabled={buttonDisabled} on:click={() => (screen = 'invite')}>
					<UserIcon />
					Invite to group
				</Button>
			</Container>
			<ul class="chats" aria-label="Contact List">
				{#each groupMembers as user}
					{@const isContact = Array.from($chats.chats)
						.map(([, chat]) => chat.chatId)
						.includes(user.address)}
					{@const isMe = user.address === wallet.address}
					<li class={`${isContact ? 'contact' : 'not-contact'} ${isMe ? 'me' : ''}`}>
						<div class="chat-button" role="listitem">
							<Container grow>
								<div class="chat">
									<div class="chat-avatar">
										<Avatar size={48} picture={user.avatar} />
									</div>
									<div class="content">
										<div class="user-info">
											{#if isMe}
												<span class="username text-italic"> You </span>
											{:else}
												<span class="username">{user.name}</span>
											{/if}
										</div>
									</div>
									{#if !isContact && !isMe}
										<Button variant="icon" on:click={() => goto(routes.INVITE(user.address))}>
											<AddComment />
										</Button>
									{:else if isContact}
										<Button variant="icon" on:click={() => goto(routes.CHAT(user.address))}>
											<ChatBot />
										</Button>
									{/if}
								</div>
							</Container>
						</div>
					</li>
				{/each}
			</ul>
		</Layout>
	{:else if screen === 'invite'}
		<Header title="Invite to group">
			<svelte:fragment slot="left">
				<div class="header-btns">
					<Button variant="icon" on:click={() => (screen = 'settings')}>
						<ChevronLeft />
					</Button>
				</div>
			</svelte:fragment>
		</Header>
		<ul class="chats invite" aria-label="Contact List">
			{#each [...$chats.chats] as [id, chat]}
				{#if !isGroupChatId(id) && !isGroupMember(id)}
					<li>
						<label for={id}>
							<div class="chat-button" role="listitem">
								<Container grow>
									<div class="chat">
										<Avatar size={48} picture={chat.users[0].avatar} />
										<div class="content">
											<div class="user-info">
												<span class="username">
													{chat.users[0].name}
												</span>
											</div>
										</div>
										<Checkbox bind:bindGroup={invitedMembers} value={id} domId={id} />
									</div>
								</Container>
							</div>
						</label>
					</li>
				{/if}
			{/each}
		</ul>
		<Container grow />
		<Divider />
		<Container justify="flex-end">
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
		&:not(.invite) {
			list-style: none;
			padding: 0;
			margin: 0;

			li {
				display: flex;
				align-items: center;
				gap: var(--spacing-12);
				border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));

				&.not-contact:not(.me) {
					.chat-avatar,
					.content {
						opacity: 0.5;
					}
				}

				&.me {
					opacity: 1;
				}

				&:first-child {
					border-top: 1px solid var(--color-step-20, var(--color-dark-step-40));
				}
			}
		}

		&.invite {
			li {
				label {
					display: flex;
					align-items: center;
					gap: var(--spacing-12);
					border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));

					:has(input[type='checkbox']:checked) {
						background-color: var(--color-step-10, var(--color-dark-step-50));
					}
				}
			}
			.chat-button {
				cursor: pointer;
			}
		}
	}

	.chat-button {
		width: 100%;
	}

	.chat {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-12);
		justify-content: flex-start;
		align-items: center;

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
