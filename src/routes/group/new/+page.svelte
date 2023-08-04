<script lang="ts">
	import { goto } from '$app/navigation'

	import AddComment from '$lib/components/icons/add-comment.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import UserIcon from '$lib/components/icons/user.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'

	import routes from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import Avatar from '$lib/components/avatar.svelte'
	import { chats, isGroupChatId } from '$lib/stores/chat'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import adapters from '$lib/adapters'
	import { clipAndResize } from '$lib/utils/image'
	import Renew from '$lib/components/icons/renew.svelte'

	$: contacts = Array.from($chats.chats)
		.filter(([, chat]) => !isGroupChatId(chat.chatId))
		.map(([, chat]) => chat.users[0])

	let groupMembers: string[] = []
	let screen: 'create' | 'details' = 'create'
	let picture = ''
	let name = ''
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

	async function createGroup() {
		buttonDisabled = true

		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')

		const groupChat = {
			messages: [],
			users: [...groupMembers, wallet.address],
			name,
			avatar: picture,
		}
		const chatId = await adapters.startGroupChat(wallet, groupChat)
		if ($walletStore.wallet) {
			await adapters.sendInvite($walletStore.wallet, chatId, groupMembers)
		}

		buttonDisabled = false

		goto(routes.GROUP_CHAT(chatId))
	}
</script>

{#if $walletStore.loading || !$walletStore.wallet || $chats.loading}
	<Container align="center" grow gap={6} justify="center">
		<div class="center">
			<h2>Loading...</h2>
		</div>
	</Container>
{:else if $chats.chats.size === 0}
	{@const address = $walletStore.wallet.address}
	<Header title="Create group">
		<svelte:fragment slot="left">
			<div class="header-btns">
				<Button variant="icon" on:click={() => history.go(-1)}>
					<ChevronLeft />
				</Button>
			</div>
		</svelte:fragment>
	</Header>
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<p class="text-lg text-bold">No contacts</p>
		<p class="text-lg">You can only create groups from existing chat contacts</p>
		<div class="btn-spacing">
			<Button on:click={() => goto(routes.INVITE(address))}>
				<AddComment />
				Invite to chat
			</Button>
		</div>
	</Container>
{:else if screen === 'create'}
	<Header title="Create group">
		<svelte:fragment slot="left">
			<div class="header-btns">
				<Button variant="icon" on:click={() => history.go(-1)}>
					<ChevronLeft />
				</Button>
			</div>
		</svelte:fragment>
	</Header>
	<ul class="chats" aria-label="Contact List">
		{#each [...$chats.chats] as [id, chat]}
			{#if !isGroupChatId(id)}
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
								<input type="checkbox" bind:group={groupMembers} value={id} />
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
			disabled={groupMembers.length === 0}
			on:click={() => (screen = 'details')}
		>
			<ArrowRight />
		</Button>
	</Container>
{:else if screen === 'details'}
	<Header mainContent="right" title="Set group details">
		<svelte:fragment slot="left">
			<div class="header-btns">
				<Button variant="icon" on:click={() => (screen = 'create')}>
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

	<Container grow justify="flex-end">
		<Button
			variant="strong"
			disabled={buttonDisabled || name.length === 0}
			on:click={() => createGroup()}
		>
			<Checkmark />
			Create group
		</Button>
	</Container>
{/if}

<style lang="scss">
	.center {
		text-align: center;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		justify-content: center;
		align-items: center;
		place-items: center;
	}

	.btn-spacing {
		margin-top: var(--spacing-6);
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: var(--spacing-6);
	}

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