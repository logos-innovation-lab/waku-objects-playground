<script>
	import Add from '$lib/icons/add.svelte'
	import ArrowLeft from '$lib/icons/arrow-left.svelte'

	import Container from '$lib/container.svelte'
	import Header from '$lib/header.svelte'
	import Card from '$lib/card.svelte'
	import Button from '$lib/button.svelte'

	const cards = [
		{
			image: '',
			title: 'Request transaction',
			description: 'Receive funds from anyone in the chat to your wallet.',
		},
		{
			image: '',
			title: 'Send transaction',
			description: 'Send funds to anyone in the chat from your wallet.',
		},
	]
</script>

<Header>
	<Button slot="left" icon={ArrowLeft} border={false} />
	<h1>Waku Objects</h1>
</Header>

<Container gap={12}>
	{#each cards as card}
		<Card {...card} />
	{/each}

	<Button icon={Add}>Add Waku Object</Button>
</Container>
