<script lang="ts">
	import { ChevronLeft, TrashCan } from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Spacer from '$lib/components/spacer.svelte'

	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import { installedObjectStore } from '$lib/stores/installed-objects'
	import Loading from '$lib/components/loading.svelte'
	import { page } from '$app/stores'
	import { getInstalledObjectList } from '$lib/objects/lookup'
	import { hashString } from '$lib/adapters/waku/crypto'

	let hashedObjectId = $page.params.object_id

	$: loading = $installedObjectStore.loading
	$: objects = loading ? undefined : getInstalledObjectList()
	$: object = objects?.find((object) => hashString(object.objectId) === hashedObjectId)

	function uninstall(objectId: string) {
		// TODO are you sure dialog
		installedObjectStore.removeInstalledObject(objectId)
		history.back()
	}
</script>

{#if loading || !object}
	<Layout>
		<Container align="center" gap={6} justify="center">
			<Loading />
		</Container>
	</Layout>
{:else}
	<Layout>
		<svelte:fragment slot="header">
			<Header title={object.name}>
				<Button slot="left" variant="icon" on:click={() => history.go(-1)}>
					<ChevronLeft />
				</Button>
			</Header>
		</svelte:fragment>
		<AuthenticatedOnly let:wallet>
			<Container align="center" gap={12} padX={24} padY={24}>
				<img src={object.logo} alt={object.name} />
				<p class="title">{object.name}</p>
				<p class="description">{object.description}</p>
			</Container>
			<Spacer height={12} />
			{#if !object.preInstalled && object.installed}
				<Button on:click={() => object && uninstall(object.objectId)}><TrashCan />Uninstall</Button>
			{/if}
		</AuthenticatedOnly>
	</Layout>
{/if}

<style lang="scss">
	img {
		width: 140px;
		height: 140px;
		aspect-ratio: 1;
		border-radius: 35px;
	}

	.title {
		font-size: var(--font-size-lg);
		font-weight: bold;
	}
</style>
