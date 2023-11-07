<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import type { User } from '$lib/types'
	import Avatar from '$lib/components/avatar.svelte'
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Divider from '$lib/components/divider.svelte'
	import InputField from '$lib/components/input-field.svelte'
	import Layout from '$lib/components/layout.svelte'

	export let users: User[]
	export let toUser: User | undefined = undefined
	export let profile: User
	export let onViewChange: (view: string) => void
	export let exitObject: () => void

	const setUser = (user: User) => {
		toUser = user
		onViewChange('amount')
	}
	$: otherUsers = users.filter((user) => user.publicKey !== profile.publicKey)
	let filterText = ''
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Send transaction">
			<Button slot="left" variant="icon" on:click={() => history.back()}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={24} justify="flex-start" padX={24} padY={24}>
		<p class="text-lg">Who would you like to send tokens to?</p>
		<InputField bind:value={filterText} placeholder="Search group members..." />
	</Container>

	<Divider />

	<ul>
		{#each otherUsers.filter((u) => u.name?.includes(filterText)) as user}
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li on:click={() => setUser(user)}>
				<Container grow>
					<div class="chat">
						<Avatar size={48} picture={user.avatar} seed={user.publicKey} />
						<div class="content">
							<div class="user-info">
								<span class="username text-lg">
									{user.name}
								</span>
							</div>
						</div>
						<ArrowRight size={24} />
					</div>
				</Container>
			</li>
		{/each}
	</ul>
</Layout>

<style>
	li {
		display: flex;
		align-items: center;
		gap: var(--spacing-12);
		border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));
		cursor: pointer;
	}

	.chat {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-12);
		justify-content: flex-start;
		align-items: center;
	}

	.content {
		flex-grow: 1;
	}

	.user-info {
		margin-bottom: var(--spacing-3);
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: baseline;
		justify-content: space-between;
	}

	.username {
		display: inline-flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
	}
</style>
