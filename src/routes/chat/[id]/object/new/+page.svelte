<script lang="ts">
	import { page } from '$app/stores'

	import ArrowUp from '$lib/components/icons/arrow-up.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import ObjectLink from '$lib/components/object-link.svelte'
	import ButtonBlock from '$lib/components/button-block.svelte'
	import { wakuObjectList } from '$lib/objects/lookup'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'

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

<AuthenticatedOnly>
	<Layout bgColor="shade">
		<svelte:fragment slot="header">
			<ButtonBlock on:click={() => history.back()}>
				<Header mainContent="left">
					<svelte:fragment slot="left">
						<div class="back-arrow">
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
		</svelte:fragment>
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
	</Layout>
</AuthenticatedOnly>

<style lang="scss">
	.object-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-12);
		padding: var(--spacing-12);
	}
	.back-arrow {
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
