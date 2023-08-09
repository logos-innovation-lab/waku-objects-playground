<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import type { User } from '$lib/types'

	export let users: User[]
	export let toUser: User | undefined = undefined
	export let profile: User
	export let onViewChange: (view: string) => void
	export let view: string | undefined

	const setUser = (user: User) => {
		toUser = user
		onViewChange('amount')
	}

	$: if (otherUsers.length === 1 && !view) {
		setUser(otherUsers[0])
	}
	$: otherUsers = users.filter((user) => user.address !== profile.address)
</script>

<Header title="Send transaction">
	<Button slot="left" variant="icon" on:click={() => history.back()}>
		<ChevronLeft />
	</Button>
	<Button slot="right" variant="icon" on:click={() => history.go(-2)}>
		<Close />
	</Button>
</Header>

<Container gap={24} grow justify="center" padX={24}>
	<p>Who would you like to send tokens to?</p>
</Container>

<Container gap={24} grow justify="center" padX={24}>
	{#each otherUsers as user}
		<Button on:click={() => setUser(user)}>
			{user.name}
		</Button>
	{/each}
</Container>
