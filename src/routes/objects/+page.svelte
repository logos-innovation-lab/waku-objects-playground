<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ChevronRight from '$lib/components/icons/chevron-right.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ButtonBlock from '$lib/components/button-block.svelte'
	import InputField from '$lib/components/input-field.svelte'
	import Spacer from '$lib/components/spacer.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
	import { getInstalledObjectList } from '$lib/objects/lookup'
	import { getObjectSpec } from '$lib/objects/external/lib'
	import { installedObjectStore } from '$lib/stores/installed-objects'
	import Loading from '$lib/components/loading.svelte'
	import { hashString } from '$lib/adapters/waku/crypto'

	let objectPath = ''

	$: loading = $installedObjectStore.loading
	$: installedObjects = $installedObjectStore && getInstalledObjectList()

	async function addObject() {
		const { object } = await getObjectSpec(objectPath, 'chat')
		installedObjectStore.update((state) => {
			state.objects.set(objectPath, {
				objectId: objectPath,
				name: object.name,
				description: object.description,
				logo: object.files.logo.path,
				installed: true,
			})
			return { ...state }
		})
		objectPath = ''
	}
</script>

{#if loading}
	<Layout>
		<Container align="center" gap={6} justify="center">
			<Loading />
		</Container>
	</Layout>
{:else}
	<Layout>
		<svelte:fragment slot="header">
			<Header title="Waku Objects">
				<Button slot="left" variant="icon" on:click={() => history.go(-1)}>
					<ChevronLeft />
				</Button>
			</Header>
		</svelte:fragment>
		<AuthenticatedOnly let:wallet>
			{#each installedObjects as object}
				<ButtonBlock
					borderBottom
					on:click={() => goto(routes.SETTINGS_OBJECT(hashString(object.objectId)))}
				>
					<Container direction="row" justify="space-between" align="center" alignItems="center">
						<div class="icon">
							<img class="img" src={object.logo} alt={object.name} />
							{object.name}{`${object.preInstalled ? '*' : ''}`}
						</div>
						<div>
							<Button variant="icon">
								<ChevronRight />
							</Button>
						</div>
					</Container>
				</ButtonBlock>
			{/each}
			<Container align="center" gap={12} padX={24} padY={24}>
				Developer stuff
				<InputField bind:value={objectPath} label="Object path" />
				<Button on:click={addObject}>Add object</Button>
			</Container>
			<Spacer height={12} />
		</AuthenticatedOnly>
	</Layout>
{/if}

<style lang="scss">
	img {
		width: 72px;
		height: 72px;
		aspect-ratio: 1;
		border-radius: 18px;
	}

	.icon {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: var(--spacing-12);
		padding-left: var(--spacing-12);
	}
</style>
