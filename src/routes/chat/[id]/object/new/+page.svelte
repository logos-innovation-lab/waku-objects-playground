<script lang="ts">
	import { page } from '$app/stores'

	import ArrowUp from '$lib/components/icons/arrow-up.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import { browser } from '$app/environment'
	import { profile } from '$lib/stores/profile'
	import ObjectLink from '$lib/components/object-link.svelte'
	import ButtonBlock from '$lib/components/button-block.svelte'
	import { wakuObjectList } from '$lib/objects/lookup'

	const objects = wakuObjectList.map((object) => ({
		...object,
		onClick: object.standalone
			? () => {
					goto(ROUTES.OBJECT($page.params.id, object.objectId, 'new'))
			  }
			: () => {
					createObject(object.objectId, {
						/* TODO empty */
					})
					goto(ROUTES.CHAT($page.params.id))
			  },
	}))
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

<div class="main">
	{#if $walletStore.loading || $profile.loading}
		<Container align="center" grow gap={6} justify="center" padX={24}>
			<h2>Loading...</h2>
		</Container>
	{:else if $walletStore.error || $profile.error}
		<Container align="center" grow gap={6} justify="center" padX={24}>
			<h2>Failed to load chat: {$profile.error?.message ?? $walletStore.error?.message}</h2>
		</Container>
	{:else}
		<ButtonBlock on:click={() => history.back()}>
			<Header mainContent="left">
				<svelte:fragment slot="left">
					<div class="gray">
						<ArrowUp /> to {otherUser?.name}
					</div>
				</svelte:fragment>
				<svelte:fragment slot="right">
					<Button variant="icon">
						<Close />
					</Button>
				</svelte:fragment>
			</Header>
		</ButtonBlock>
		<div class="object-list">
			{#each objects as object}
				<div class="object" {...object}>
					<ObjectLink
						on:click={object.onClick}
						imgSrc={object.logo}
						title={object.name}
						description={object.description}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.main {
		min-height: 100dvh;
		min-height: 100vh;
		height: 100%;
		background-color: var(--color-step-10, var(--color-dark-step-50));
	}

	.object-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
		padding: var(--spacing-12);
	}
	.gray {
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
		color: var(--color-step-40, var(--color-dark-step-20));
		font-weight: var(--font-weight-500);
		:global(svg) {
			fill: var(--color-step-40, var(--color-dark-step-20));
		}
	}
</style>
