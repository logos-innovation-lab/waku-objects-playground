<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import UserIcon from '$lib/components/icons/user.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import UserFollow from '$lib/components/icons/user-follow.svelte'
	import ChatLaunch from '$lib/components/icons/chat-launch.svelte'

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
	import { uploadPicture } from '$lib/adapters/ipfs'
	import { onDestroy } from 'svelte'
	import Logout from '$lib/components/icons/logout.svelte'
	import { walletStore } from '$lib/stores/wallet'
	import ROUTES from '$lib/routes'
	import Loading from '$lib/components/loading.svelte'
	import { userDisplayName } from '$lib/utils/user'
	import { errorStore } from '$lib/stores/error'

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

	async function resizePicture(p?: File) {
		try {
			picture = p ? await uploadPicture(await clipAndResize(p, 200, 200)) : picture
		} catch (e) {
			errorStore.addStart({
				title: 'Profile Error',
				message: `Failed to upload profile picture. ${(e as Error)?.message}`,
				retry: () => resizePicture(p),
				ok: true,
			})
		}
	}
	$: resizePicture(pictureFiles && pictureFiles[0])

	async function inviteMembers(wallet: HDNodeWallet) {
		buttonDisabled = true

		try {
			await adapters.addMemberToGroupChat(chatId, invitedMembers)
			await adapters.sendInvite(wallet, chatId, invitedMembers)
		} catch (error) {
			errorStore.addEnd({
				title: 'Error',
				message: `Failed to add members to group or to invite them. ${(error as Error)?.message}`,
				retry: () => inviteMembers(wallet),
				ok: true,
			})
		}

		invitedMembers = []
		buttonDisabled = false

		screen = 'settings'
	}

	function isGroupMember(address: string) {
		return groupChat?.users.map((user) => user.address).includes(address)
	}

	$: if (
		!$chats.loading &&
		((name && name !== groupChat?.name) || (picture && picture !== groupChat?.avatar))
	) {
		debounceSaveProfile()
	}

	$: wallet = $walletStore.wallet
	let timer: ReturnType<typeof setTimeout> | undefined

	async function saveProfileNow() {
		if (!groupChat) {
			return
		}
		try {
			await adapters.saveGroupChatProfile(groupChat?.chatId, name, picture)
		} catch (error) {
			errorStore.addEnd({
				title: 'Group Error',
				message: `Failed to update group. ${(error as Error)?.message}`,
				retry: saveProfileNow,
				ok: true,
			})
		}
	}

	// Debounce saving profile
	function debounceSaveProfile() {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			saveProfileNow()
			timer = undefined
		}, 1000)
	}

	onDestroy(() => {
		if (timer) {
			clearTimeout(timer)
			saveProfileNow()
		}
	})

	function leaveGroup() {
		if (wallet?.address) {
			chats.removeChat($page.params.id)
			adapters.removeFromGroupChat($page.params.id, wallet.address)
			goto(ROUTES.HOME)
		}
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if $chats.loading}
		<Layout>
			<Container align="center" grow gap={6} justify="center">
				<Loading />
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
				<Avatar group {picture} seed={chatId} size={140} />
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
										<Avatar size={48} picture={user.avatar} seed={user.address} />
									</div>
									<div class="content">
										<div class="user-info">
											{#if isMe}
												<span class="username text-italic"> You </span>
											{:else}
												<span class="username">{userDisplayName(user)}</span>
											{/if}
										</div>
									</div>
									{#if !isContact && !isMe}
										<Button variant="icon" on:click={() => goto(routes.INVITE(user.address))}>
											<UserFollow />
										</Button>
									{:else if isContact}
										<Button variant="icon" on:click={() => goto(routes.CHAT(user.address))}>
											<ChatLaunch />
										</Button>
									{/if}
								</div>
							</Container>
						</div>
					</li>
				{/each}
			</ul>
			<Container gap={12} alignItems="center" padY={24}>
				<Button disabled={buttonDisabled} on:click={() => leaveGroup()}>
					<Logout />
					Leave group
				</Button>
			</Container>
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
										<Avatar size={48} picture={chat.users[0].avatar} seed={chat.users[0].address} />
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
