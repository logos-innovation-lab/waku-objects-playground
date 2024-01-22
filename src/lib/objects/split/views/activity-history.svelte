<script lang="ts">
	import { Close, ChevronLeft } from 'carbon-icons-svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Layout from '$lib/components/layout.svelte'

	import Activity from '../components/activity.svelte'

	import type { User as UserType } from '$lib/types'
	import type { Expense, Payment } from '../schemas'
	import type { Activity as ActivityType } from '../types'
	import type { Token } from '$lib/objects/schemas'

	export let profile: UserType
	export let users: UserType[]
	export let expenses: Expense[]
	export let payments: Payment[]
	export let token: Token

	export let exitObject: () => void
	export let goBack: () => void

	let activities: ActivityType[] = []
	$: activities = [
		...payments.map((p) => ({ ...p, type: 'payment' } as ActivityType)),
		...expenses.map((e) => ({ ...e, type: 'expense' } as ActivityType)),
	].sort((a, b) => b.timestamp - a.timestamp)
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Activity history">
			<Button slot="left" variant="icon" on:click={goBack}>
				<ChevronLeft />
			</Button>
			<Button slot="right" variant="icon" on:click={exitObject}>
				<Close />
			</Button>
		</Header>
	</svelte:fragment>

	<div class="preview">
		<Container padY={24} gap={12} padX={12} grow>
			{#each activities as activity}
				<Activity {activity} {users} {profile} {token} />
			{/each}
		</Container>
	</div>
</Layout>

<style>
	.preview {
		min-height: 100%;
		background-color: var(--color-step-10, var(--color-dark-step-50));
		border-bottom: 1px solid var(--color-step-20, var(--color-dark-step-40));
	}
</style>
