<script lang="ts">
	import ArrowRight from '$lib/components/icons/arrow-right.svelte'
	import Close from '$lib/components/icons/close.svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'

	import Layout from '$lib/components/layout.svelte'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import Add from '$lib/components/icons/add.svelte'

	export let exitObject: () => void
	export let newCollection: () => void
	export let goBack: () => void
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
	<Container gap={12} justify="center" padX={24}>
		<h2>Welcome to Split!</h2>
		<p>Shared expenses are organized into collections shared with chat members.</p>
		<ul>
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li class="disabled">
				<Container grow>
					<div class="chat">
						<div class="content">
							<div class="user-info">
								<span class="username text-lg"> Add expense to an existing collection </span>
							</div>
						</div>
						<ArrowRight size={24} />
					</div>
				</Container>
			</li>
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li on:click={newCollection}>
				<Container grow>
					<div class="chat">
						<Add />
						<div class="content">
							<div class="user-info">
								<span class="username text-lg"> Create new collection </span>
							</div>
						</div>
						<ArrowRight size={24} />
					</div>
				</Container>
			</li>
		</ul>
	</Container>
</Layout>

<style>
	.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
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
