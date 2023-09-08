<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'

	import Layout from '$lib/components/layout.svelte'
	import { splitDescriptor } from '..'
	import { uploadPicture } from '$lib/adapters/ipfs'
	import { resize } from '$lib/utils/image'
	import Image from '$lib/components/image.svelte'
	import InputFile from '$lib/components/input-file.svelte'
	import Add from '$lib/components/icons/add.svelte'
	import TrashCan from '$lib/components/icons/trash-can.svelte'

	export let images: string[]
	export let exitObject: () => void
	export let goNext: () => void
	export let goBack: () => void

	let files: FileList | undefined = undefined
	let uploading: boolean

	async function uploadPictures(fls: FileList) {
		uploading = true

		for (let i = 0; i < fls.length; i++) {
			try {
				const image = fls[i]
				const resizedImage = await resize(image)
				const imageHash = await uploadPicture(resizedImage)
				images.push(imageHash)
			} catch (error) {
				console.error(error)
			}
		}
		files = undefined
		images = [...new Set(images)] // We want only unique images
		uploading = false
	}

	function removeImage(value: string) {
		images = images.filter((i) => i !== value)
	}

	$: if (files) uploadPictures(files)
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
		<h2>Would you like to add images?</h2>
		<p>This is optional</p>
		<Container
			direction="row"
			justify="flex-start"
			alignItems="left"
			padX={0}
			padY={0}
			gap={12}
			wrap="wrap"
		>
			<InputFile multiple bind:files size={128} borderRadius={12} margin="none">
				<Add size={32} />
			</InputFile>
			{#each images as image}
				<Image picture={image}>
					<Button variant="icon" on:click={() => removeImage(image)}><TrashCan /></Button>
				</Image>
			{/each}
		</Container>
	</Container>
	<Container justify="flex-end">
		<Button variant="strong" on:click={goNext}>
			<ArrowRight />
		</Button>
	</Container>
</Layout>
