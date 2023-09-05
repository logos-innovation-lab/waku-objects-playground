<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input-field.svelte'

	import Layout from '$lib/components/layout.svelte'
	import { splitDescriptor } from '..'

	export let description: string
	export let exitObject: () => void
	export let goNext: () => void
	export let goBack: () => void
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title={splitDescriptor.name}>
			<Button slot="left" variant="icon" on:click={goBack}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={24} justify="center" padX={24}>
		<h2>What was this expense?</h2>
		<Input
			autofocus
			bind:value={description}
			label="Description"
			placeholder="What did you pay for?"
		/>
	</Container>
	<Container justify="flex-end">
		<Button variant="strong" disabled={!description} on:click={goNext}>
			<ArrowRight />
		</Button>
	</Container>
</Layout>
