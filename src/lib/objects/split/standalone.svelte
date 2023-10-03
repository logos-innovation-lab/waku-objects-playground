<script lang="ts">
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import Loading from '$lib/components/loading.svelte'
	import { SPLIT_TOKEN } from '.'
	import type { WakuObjectArgs } from '..'
	import type { DataMessage, Expense, Store } from './schemas'
	import type { View } from './types'
	import Accounting from './views/accounting.svelte'
	import ActivityHistory from './views/activity-history.svelte'

	import ChooseAmount from './views/choose-amount.svelte'
	import ChooseCollectionMembers from './views/choose-collection-members.svelte'
	import ChooseCollectionName from './views/choose-collection-name.svelte'
	import ChooseExpenseName from './views/choose-expense-name.svelte'
	import ChooseImages from './views/choose-images.svelte'
	import Collection from './views/collection.svelte'
	import ExpenseDetail from './views/expense-detail.svelte'
	import Expenses from './views/expenses.svelte'
	import SettleNow from './views/settle-now.svelte'
	import Summary from './views/summary.svelte'
	import Welcome from './views/welcome.svelte'

	export let args: WakuObjectArgs<Store, DataMessage, View>

	let amount = ''
	let description = ''
	let collectionName = ''
	let images: string[] = []
	const token = SPLIT_TOKEN
	$: nativeToken = {
		...defaultBlockchainNetwork.nativeToken,
		amount:
			args.tokens.find((t) => t.address === defaultBlockchainNetwork.nativeToken.address)?.amount ??
			0n,
	}

	// Utility function which makes it easier to handle history for closing the object
	const exitObject = (depth: number) => () => history.go(-depth)
	const goNext = (pageName: View) => () => args.onViewChange(pageName)
	const goBack = () => history.back()

	let expense: Expense | undefined = undefined
	$: expense = args.store?.expenses.find((e) => e.txHash === args.viewParams[0])
	$: {
		if (!collectionName && args.store) {
			collectionName = args.store.collectionName
		}
	}
</script>

{#if args.view === 'expense'}
	{#if expense === undefined}
		<Loading />
	{:else}
		<ExpenseDetail
			{expense}
			{token}
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
			{token}
			instanceId={args.instanceId}
			chatName={args.chatName}
			profile={args.profile}
			{splitterAddress}
			exitObject={exitObject(2)}
			send={args.send}
			getContract={args.getContract}
			tokens={args.tokens}
			fiatRates={args.exchangeRates}
			fiatSymbol={args.fiatSymbol}
		/>
	{/if}
{:else if args.view === 'accounting'}
	<Accounting
		{token}
		users={args.users}
		profile={args.profile}
		balances={args.store?.balances ?? []}
		exitObject={exitObject(2)}
		send={args.send}
		onViewChange={args.onViewChange}
	/>
{:else if args.view === 'collection'}
	<Collection
		{token}
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
		{token}
		expenses={args.store?.expenses ?? []}
		onViewChange={args.onViewChange}
		exitObject={exitObject(2)}
		{goBack}
	/>
{:else if args.view === 'activity'}
	<ActivityHistory
		{token}
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
		{token}
		{nativeToken}
		chainId={args.chainId}
		collectionName={collectionName ?? `#${args.instanceId.slice(0, 4)}`}
		profile={args.profile}
		chatName={args.chatName}
		send={args.send}
		exitObject={exitObject(5)}
		getContract={args.getContract}
		users={args.store?.users ?? args.users.map((u) => u.address)}
		splitterAddress={args.store?.splitterAddress}
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
{:else if args.view === 'collection-name'}
	<ChooseCollectionName
		bind:collectionName
		instanceId={args.instanceId}
		exitObject={exitObject(1)}
		goNext={goNext('collection-members')}
	/>
{:else if args.view === 'collection-members'}
	<ChooseCollectionMembers
		users={args.users}
		{goBack}
		exitObject={exitObject(2)}
		goNext={exitObject(2)}
	/>
{:else if args.view === 'amount' || collectionName !== ''}
	<ChooseAmount bind:amount exitObject={exitObject(2)} goNext={goNext('name')} {goBack} {token} />
{:else}
	<Welcome exitObject={exitObject(1)} {goBack} newCollection={goNext('collection-name')} />
{/if}
