<script lang="ts">
	import { goto } from '$app/navigation'

	import AddComment from '$lib/components/icons/add-comment.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	import Button from '$lib/components/button.svelte'
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import InputField from '$lib/components/input-field.svelte'

	import routes from '$lib/routes'
	import Avatar from '$lib/components/avatar.svelte'
	import { chats, isGroupChatId } from '$lib/stores/chat'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Checkmark from '$lib/components/icons/checkmark.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import adapters from '$lib/adapters'
	import { clipAndResize } from '$lib/utils/image'
	import Renew from '$lib/components/icons/renew.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import type { HDNodeWallet } from 'ethers/lib.commonjs'
	import Layout from '$lib/components/layout.svelte'
	import Checkbox from '$lib/components/checkbox.svelte'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import { genRandomHex } from '$lib/utils'

	let groupMembers: string[] = []
	let screen: 'create' | 'details' = 'create'
	let picture = ''
	let name = ''
	let pictureFiles: FileList | undefined = undefined
	let buttonDisabled = false

	const chatId = genRandomHex(64)

	async function resizePersonaPicture(p?: File) {
		try {
			picture = p ? await uploadPicture(await clipAndResize(p, 200, 200)) : picture
		} catch (error) {
			console.error(error)
		}
	}
	$: resizePersonaPicture(pictureFiles && pictureFiles[0])

	async function createGroup(wallet: HDNodeWallet) {
		buttonDisabled = true

		await adapters.startGroupChat(wallet, chatId, groupMembers, name, picture)
		await adapters.sendInvite(wallet, chatId, groupMembers)

		buttonDisabled = false

		goto(routes.GROUP_CHAT(chatId))
	}
</script>

<AuthenticatedOnly let:wallet>
	{#if $chats.loading}
		<Layout>
			<Container align="center" gap={6} justify="center">
				<div class="center">
					<h2>Loading...</h2>
				</div>
			</Container>
		</Layout>
	{:else if $chats.chats.size === 0}
		{@const address = wallet.address}
		<Layout>
			<svelte:fragment slot="header">
				<Header title="Create group">
					<svelte:fragment slot="left">
						<div class="header-btns">
							<Button variant="icon" on:click={() => history.go(-1)}>
								<ChevronLeft />
							</Button>
						</div>
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			<Container align="center" gap={6} justify="center" padX={24}>
				<p class="text-lg text-bold">No contacts</p>
				<p class="text-lg">You can only create groups from existing chat contacts</p>
				<div class="btn-spacing">
					<Button on:click={() => goto(routes.INVITE(address))}>
						<AddComment />
						Invite to chat
					</Button>
				</div>
			</Container>
		</Layout>
	{:else if screen === 'create'}
		<Layout>
			<svelte:fragment slot="header">
				<Header title="Create group">
					<svelte:fragment slot="left">
						<div class="header-btns">
							<Button variant="icon" on:click={() => history.go(-1)}>
								<ChevronLeft />
							</Button>
						</div>
					</svelte:fragment>
				</Header>
			</svelte:fragment>
			<ul class="chats" aria-label="Contact List">
				{#each [...$chats.chats] as [id, chat]}
					{#if !isGroupChatId(id)}
						<li>
							<label for={id}>
								<div class="chat-button" role="listitem">
									<Container grow>
										<div class="chat">
											<Avatar
												size={48}
												picture={chat.users[0].avatar}
												seed={chat.users[0].address}
											/>
											<div class="content">
												<div class="user-info">
													<span class="username">
														{chat.users[0].name}
													</span>
												</div>
											</div>
											<Checkbox bind:bindGroup={groupMembers} value={id} domId={id} />
										</div>
									</Container>
								</div>
							</label>
						</li>
					{/if}
				{/each}
			</ul>
			<Container padX={0} padY={0} grow />
			<Container justify="flex-end">
				<Button
					variant="strong"
					disabled={groupMembers.length === 0}
					on:click={() => (screen = 'details')}
				>
					<ArrowRight />
				</Button>
			</Container>
		</Layout>
	{:else if screen === 'details'}
		<Layout>
			<svelte:fragment slot="header">
				<Header mainContent="right" title="Set group details">
					<svelte:fragment slot="left">
						<div class="header-btns">
							<Button variant="icon" on:click={() => (screen = 'create')}>
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
			<Container padX={0} padY={0} grow />
			<Container justify="flex-end">
				<Button
					variant="strong"
					disabled={buttonDisabled || name.length === 0}
					on:click={() => createGroup(wallet)}
				>
					<Checkmark />
					Create group
				</Button>
			</Container>
		</Layout>
	{/if}
</AuthenticatedOnly>

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
			label {
				display: flex;
				align-items: center;
				gap: var(--spacing-12);
				border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));

				:has(input[type='checkbox']:checked) {
					background-color: var(--color-step-10, var(--color-dark-step-50));
				}

				.chat-button {
					width: 100%;
					cursor: pointer;
				}
			}
		}
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
</style>
