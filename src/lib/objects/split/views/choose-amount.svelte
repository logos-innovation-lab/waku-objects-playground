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

	export let amount: string
	export let exitObject: () => void
	export let goNext: () => void
	export let goBack: () => void

	$: error = !/^\d*\.?\d*$/.test(amount) ? 'Please enter valid number' : undefined
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
	<Container gap={12} justify="center" padX={24}>
		<h2>Add an expense you paid and that you would like to share with the group.</h2>
		<p>It will be split equally between all chat members</p>
		<div class="input">
			<Input unit="DAI" label="Paid amount" autofocus bind:value={amount} placeholder="0" />
		</div>
		{#if error}
			<p>{error}</p>
		{/if}
	</Container>
	<Container justify="flex-end">
		<Button variant="strong" disabled={!amount || Boolean(error)} on:click={goNext}>
			<ArrowRight />
		</Button>
	</Container>
</Layout>

<style>
	.input {
		margin-top: 24px;
	}
</style>
