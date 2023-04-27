<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'
	import Container from '$lib/components/container.svelte'
</script>

<Container>
	<Header title="Send transaction">
		<Button slot="left" icon={ArrowLeft} border={false} variant="nopad" />
	</Header>
</Container>
