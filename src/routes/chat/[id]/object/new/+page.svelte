<script lang="ts">
	import { page } from '$app/stores'

	import ArrowUp from '$lib/components/icons/arrow-up.svelte'
	import ChevronRight from '$lib/components/icons/chevron-right.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import { HELLO_WORLD_OBJECT_ID } from '$lib/objects/hello-world'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import { browser } from '$app/environment'
	import { profile } from '$lib/stores/profile'

	const objects = [
		{
			image: 'https://picsum.photos/200',
			title: 'Request transaction',
			description: 'Request a transaction in the chat to your prefered wallet',
			onClick: () => goto(ROUTES.REQUEST_TRANSACTION),
		},
		{
			image: 'https://picsum.photos/200',
			title: 'Send transaction',
			description: 'Send funds to anyone in the chat from your wallet.',
			onClick: () => goto(ROUTES.SEND_TRANSACTION),
		},
		{
			image: 'https://picsum.photos/200',
			title: 'Hello World',
			description: 'Say hello',
			onClick: () => {
				createObject(HELLO_WORLD_OBJECT_ID, {
					/* TODO empty */
				})
				history.back()
			},
		},
	]
	let loading = false
	let text = ''
	$: if (browser && !$walletStore.loading && $walletStore.wallet === undefined) goto(ROUTES.HOME)

	const createObject = async <T>(objectId: string, t: T) => {
		// TODO random
		const genRanHex = (size: number) =>
			[...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
		const instanceId = genRanHex(12)
		await sendData(objectId, instanceId, t)
	}

	const sendData = async (objectId: string, instanceId: string, data: unknown) => {
		loading = true
		const wallet = $walletStore.wallet
		if (!wallet) throw new Error('no wallet')
		await adapters.sendData(wallet, $page.params.id, objectId, instanceId, data)
		text = ''
		loading = false
	}

	$: otherUser = $chats.chats
		.get($page.params.id)
		?.users.find((m) => m.address !== $walletStore.wallet?.address)
</script>

{#if $walletStore.loading || $profile.loading}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $walletStore.error || $profile.error}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Failed to load chat: {$profile.error?.message ?? $walletStore.error?.message}</h2>
	</Container>
{:else}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<Header mainContent="left">
		<svelte:fragment slot="left">
			<div class="gray">
				<ArrowUp /> to {otherUser?.name}
			</div>
		</svelte:fragment>
		<svelte:fragment slot="right">
			<Button variant="icon" on:click={() => history.back()}>
				<Close />
			</Button>
		</svelte:fragment>
	</Header>
	<div>
		{#each objects as object}
			<div class="object" {...object}>
				<Container direction="row" gap={12} alignItems="center">
					<img class="img" src={object.image} alt="object logo" />
					<p>
						<span class="text-bold text-lg">{object.title}</span>
						{object.description}
					</p>
					<Button variant="icon" on:click={object.onClick}>
						<ChevronRight />
					</Button>
				</Container>
			</div>
		{/each}
	</div>
{/if}

<style lang="scss">
	.gray {
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
		color: var(--gray40);
		font-weight: var(--font-weight-500);
		:global(svg) {
			fill: var(--gray40);
		}
	}
	.object {
		padding: var(--spacing-12) 0 var(--spacing-12) var(--spacing-12);
		border-bottom: var(--border);

		.img {
			width: 70px;
		}
		img {
			width: 70px;
			height: 70px;
			aspect-ratio: 1;
			border-radius: 18px;
		}
		span {
			display: block;
			margin-bottom: var(--spacing-6);
		}
		p {
			flex-grow: 1;
		}
	}
	.messages {
		flex-grow: 1;
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
		max-width: 75%;
		margin-right: auto;
		margin-left: 0;
		&:not(:last-child) {
			margin-bottom: var(--spacing-12);
		}

		&.my-message {
			font-style: italic;
			margin-left: auto;
			margin-right: 0;
		}
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
		border-radius: var(--border-radius);
		display: inline-block;
		font-family: var(--font-serif);
		background-color: var(--white);
	}

	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--gray10);
	}

	.chat-messages {
		flex-grow: 1;
		overflow-y: auto;
	}

	.chat-input-wrapper {
		flex-grow: 0;
		position: sticky;
		bottom: 0;
		background-color: var(--white);
		border-top: 1px solid var(--gray20);
	}

	.chat-input {
		display: flex;
		gap: var(--spacing-12);
		align-items: center;
	}
</style>
