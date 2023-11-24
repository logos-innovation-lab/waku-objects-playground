<script lang="ts">
	import { page } from '$app/stores'

	import ArrowUp from '$lib/components/icons/arrow-up.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Close from '$lib/components/icons/close.svelte'
	import Modal from '$lib/components/modal.svelte'

	import { goto } from '$app/navigation'
	import { chats } from '$lib/stores/chat'
	import adapters from '$lib/adapters'
	import ROUTES from '$lib/routes'
	import { walletStore } from '$lib/stores/wallet'
	import ObjectLink from '$lib/components/object-link.svelte'
	import ButtonBlock from '$lib/components/button-block.svelte'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import type { JSONSerializable, WakuObjectSvelteDescriptor } from '$lib/objects'
	import { genRandomHex } from '$lib/utils'
	import { getInstalledObjectList, type InstalledObjectDescriptor } from '$lib/objects/lookup'
	import { errorStore } from '$lib/stores/error'
	import ChatLaunch from '$lib/components/icons/chat-launch.svelte'

	$: otherUser = $chats.chats
		.get($page.params.id)
		?.users.find((m) => m.publicKey !== $walletStore.wallet?.signingKey.compressedPublicKey)

	const installedObjects = getInstalledObjectList()
		.map((object) => ({
			...object,
			add: () => addObject(object),
			showInvite: () => (showInvite = object),
		}))
		.filter((object) => object.installed)

	const chatObjects = $chats.chats.get($page.params.id)?.objects
	const alreadyUsedObjects = installedObjects.filter(
		(object) => chatObjects && chatObjects.includes(object.objectId),
	)
	const notUsedObjects = installedObjects.filter(
		(object) => !chatObjects || !chatObjects.includes(object.objectId),
	)
	let loading = false
	let text = ''
	let showInvite: InstalledObjectDescriptor | undefined = undefined

	const createObject = async (objectId: string, t: JSONSerializable) => {
		const instanceId = genRandomHex(12)
		await sendData(objectId, instanceId, t)
	}

	const sendData = async (objectId: string, instanceId: string, data: JSONSerializable) => {
		loading = true
		const wallet = $walletStore.wallet
		if (!wallet) {
			errorStore.addEnd({
				title: 'Wallet Error',
				message: 'No wallet found',
				retry: () => sendData(objectId, instanceId, data),
				reload: true,
			})
			return
		}
		try {
			await adapters.sendData(wallet, $page.params.id, objectId, instanceId, data)
		} catch (error) {
			errorStore.addEnd({
				title: 'Error',
				message: `Failed to send data. ${(error as Error)?.message}`,
				retry: () => sendData(objectId, instanceId, data),
			})
		}
		text = ''
		loading = false
	}

	function addObject(object: WakuObjectSvelteDescriptor) {
		if (object.standalone) {
			goto(ROUTES.OBJECT($page.params.id, encodeURIComponent(object.objectId), 'new'))
			return
		}

		createObject(object.objectId, {
			/* TODO empty */
		})
		goto(ROUTES.CHAT($page.params.id))
	}

	async function sendInstallInvite(object: InstalledObjectDescriptor) {
		// workaround for preinstalled objects
		if (object.preInstalled) {
			addObject(object)
			return
		}

		try {
			await adapters.sendInstall($page.params.id, object.objectId, 'invite')
			showInvite = undefined
			history.back()
		} catch (error) {
			errorStore.addEnd({
				title: 'Error',
				message: `Failed to send invite. ${(error as Error)?.message}`,
				retry: () => sendInstallInvite(object),
			})
		}
	}
</script>

<AuthenticatedOnly>
	{#if showInvite}
		<Modal
			title="Invite to use"
			message={`Would you like to invite ${otherUser?.name} to use "${showInvite.name} in this chat?"`}
		>
			<Button variant="strong" on:click={() => showInvite && sendInstallInvite(showInvite)}>
				<ChatLaunch /> Send invite
			</Button>
			<Button on:click={() => (showInvite = undefined)}>
				<Close /> Cancel
			</Button>
		</Modal>
	{/if}
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

		{#if alreadyUsedObjects.length > 0}
			<div class="list-title">Already in this chat</div>
		{/if}
		<div class="object-list">
			{#each alreadyUsedObjects as object}
				<div class="object" {...object}>
					<ObjectLink
						on:click={object.add}
						imgSrc={object.logo}
						title={object.name + (object.preInstalled ? '*' : '')}
						description={object.description}
					/>
				</div>
			{/each}
		</div>

		{#if notUsedObjects.length > 0}
			<div class="list-title">Not yet in this chat</div>
		{/if}
		<div class="object-list">
			{#each notUsedObjects as object}
				<div class="object" {...object}>
					<ObjectLink
						on:click={object.showInvite}
						imgSrc={object.logo}
						title={object.name + (object.preInstalled ? '*' : '')}
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
	.list-title {
		display: flex;
		flex-direction: row;
		justify-content: center;
		font-weight: bold;
	}
</style>
