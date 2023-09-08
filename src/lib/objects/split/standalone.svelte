<script lang="ts">
	import type { WakuObjectArgs } from '..'
	import type { DataMessage, Expense, Store } from './schemas'
	import type { View } from './types'
	import Accounting from './views/accounting.svelte'
	import ActivityHistory from './views/activity-history.svelte'

	import ChooseAmount from './views/choose-amount.svelte'
	import ChooseExpenseName from './views/choose-expense-name.svelte'
	import ChooseImages from './views/choose-images.svelte'
	import Collection from './views/collection.svelte'
	import ExpenseDetail from './views/expense-detail.svelte'
	import Expenses from './views/expenses.svelte'
	import SettleNow from './views/settle-now.svelte'
	import Summary from './views/summary.svelte'

	export let args: WakuObjectArgs<Store, DataMessage, View>

	let amount = ''
	let description = ''
	let images: string[] = []

	// Utility function which makes it easier to handle history for closing the object
	const exitObject = (depth: number) => () => history.go(-depth)
	const goNext = (pageName: View) => () => args.onViewChange(pageName)
	const goBack = () => history.back()

	let expense: Expense | undefined = undefined
	$: expense = args.store?.expenses.find((e) => e.txHash === args.viewParams[0])
</script>

{#if args.view === 'expense'}
	{#if expense === undefined}
		<p>Loading...</p>
	{:else}
		<ExpenseDetail
			{expense}
			users={args.users}
			profile={args.profile}
			exitObject={exitObject(1)}
			send={args.send}
			onViewChange={args.onViewChange}
		/>
	{/if}
{:else if args.view === 'settle'}
	{@const splitterAddress = args.store?.splitterAddress}
	{#if splitterAddress === undefined}
		<p>No splitter address...</p>
	{:else}
		<SettleNow
			instanceId={args.instanceId}
			chatName={args.chatName}
			profile={args.profile}
			balances={args.store?.balances ?? []}
			{splitterAddress}
			exitObject={exitObject(2)}
			send={args.send}
			getContract={args.getContract}
			tokens={args.tokens}
		/>
	{/if}
{:else if args.view === 'accounting'}
	<Accounting
		users={args.users}
		profile={args.profile}
		balances={args.store?.balances ?? []}
		exitObject={exitObject(2)}
		send={args.send}
		onViewChange={args.onViewChange}
	/>
{:else if args.view === 'collection'}
	<Collection
		instanceId={args.instanceId}
		chatName={args.chatName}
		profile={args.profile}
		balances={args.store?.balances ?? []}
		expenses={args.store?.expenses ?? []}
		payments={args.store?.payments ?? []}
		users={args.users}
		exitObject={exitObject(1)}
		send={args.send}
		onViewChange={args.onViewChange}
	/>
{:else if args.view === 'expenses'}
	<Expenses
		users={args.users}
		profile={args.profile}
		expenses={args.store?.expenses ?? []}
		onViewChange={args.onViewChange}
		exitObject={exitObject(2)}
		{goBack}
	/>
{:else if args.view === 'activity'}
	<ActivityHistory
		expenses={args.store?.expenses ?? []}
		payments={args.store?.payments ?? []}
		users={args.users}
		profile={args.profile}
		exitObject={exitObject(2)}
		{goBack}
	/>
{:else if args.view === 'summary'}
	<Summary
		{description}
		{amount}
		{images}
		profile={args.profile}
		chatName={args.chatName}
		send={args.send}
		exitObject={exitObject(5)}
		getContract={args.getContract}
		users={args.users}
		splitterAddress={args.store?.splitterAddress}
		instanceId={args.instanceId}
	/>
{:else if args.view === 'images'}
	<ChooseImages bind:images exitObject={exitObject(4)} goNext={goNext('summary')} {goBack} />
{:else if args.view === 'name'}
	<ChooseExpenseName
		bind:description
		exitObject={exitObject(3)}
		goNext={goNext('images')}
		{goBack}
	/>
{:else}
	<ChooseAmount bind:amount exitObject={exitObject(2)} goNext={goNext('name')} {goBack} />
{/if}
