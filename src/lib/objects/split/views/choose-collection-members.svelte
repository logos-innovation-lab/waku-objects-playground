<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'
	import Avatar from '$lib/components/avatar.svelte'

	import type { User } from '$lib/objects/schemas'
	import Checkmark from '$lib/components/icons/checkmark.svelte'

	export let users: User[]
	export let exitObject: () => void
	export let goBack: () => void
	export let goNext: () => void
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Split">
			<Button slot="left" variant="icon" on:click={goBack}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>
	<Container gap={12} padX={24}>
		<h2>Shared with everyone</h2>
		<p>
			Expenses added to this collection will be shared equally between everyone in the group chat.
		</p>
		<ul>
			{#each users as user}
				<li>
					<Container grow>
						<div class="chat">
							<Avatar size={48} picture={user.avatar} seed={user.address} />
							<div class="content">
								<div class="user-info">
									<span class="username text-lg">
										{user.name}
									</span>
								</div>
							</div>
						</div>
					</Container>
				</li>
			{/each}
		</ul>
	</Container>
	<Container justify="flex-end">
		<Button variant="strong" on:click={goNext}>
			<Checkmark /> Create collection
		</Button>
	</Container>
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
