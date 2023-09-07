<script lang="ts">
	import Layout from '$lib/components/layout.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import type { WakuObjectArgs } from '..'
	import IframeComponent from './iframe.svelte'
	import { getNPMObject, type LoadedObject } from './lib'

	// Exports
	export let args: WakuObjectArgs

	let object: LoadedObject | null

	$: args && getNPMObject(args.objectId).then((result) => (object = result))
	$: isGroupchat = args.users.length !== 2

	// Utility function which makes it easier to handle history for closing the object
	const exitObject = (depth: number) => () => history.go(isGroupchat ? -depth - 1 : -depth)
</script>

{#if object}
	<Layout>
		<svelte:fragment slot="header">
			<Header title={object.name}>
				<Button slot="left" variant="icon" on:click={() => history.back()}>
					<ChevronLeft />
				</Button>
				<Button slot="right" variant="icon" on:click={exitObject(1)}>
					<Close />
				</Button>
			</Header>
		</svelte:fragment>
		<IframeComponent {args} message={undefined} />
	</Layout>
{/if}
