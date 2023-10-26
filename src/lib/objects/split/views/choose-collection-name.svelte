<script lang="ts">
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input-field.svelte'

	import Layout from '$lib/components/layout.svelte'

	export let collectionName: string
	export let instanceId: string
	export let exitObject: () => void
	export let goNext: () => void

	function confirm() {
		if (!collectionName) collectionName = `#${instanceId.slice(0, 4)}`
		goNext()
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Create a collection">
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={12} justify="center" padX={24}>
		<h2>Give a name to your collection</h2>
		<p>Help others understand which expenses should be shared within this collection.</p>
		<div class="input">
			<Input
				label="Collection name"
				autofocus
				bind:value={collectionName}
				placeholder={`#${instanceId.slice(0, 4)}`}
			/>
		</div>
	</Container>
	<Container justify="flex-end">
		<Button variant="strong" on:click={confirm}>
			<ArrowRight />
		</Button>
	</Container>
</Layout>

<style>
	.input {
		margin-top: 24px;
	}
</style>
