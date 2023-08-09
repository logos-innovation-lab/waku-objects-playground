<script lang="ts">
	import type { WakuObjectArgs } from '..'
	import {
		SendTransactionStoreSchema,
		type SendTransactionStore,
		type SendTransactionDataMessage,
	} from './schemas'
	import Details from './views/details.svelte'
	import type { Token } from '../schemas'
	import type { User } from '$lib/types'

	import Amount from './views/amount.svelte'
	import Confirm from './views/confirm.svelte'
	import SelectUser from './views/selectUser.svelte'

	export let args: WakuObjectArgs<SendTransactionStore, SendTransactionDataMessage>

	let store: SendTransactionStore | undefined
	$: {
		if (args.store) {
			const res = SendTransactionStoreSchema.safeParse(args.store)
			if (res.success) {
				store = res.data
			} else {
				console.error(res.error)
			}
		}
	}

	let token: Token
	let amount = ''
	let toUser: User | undefined = undefined
</script>

{#if store?.type === 'init' && toUser}
	<Confirm
		{toUser}
		{token}
		{amount}
		profile={args.profile}
		send={args.send}
		sendTransaction={args.sendTransaction}
		estimateTransaction={args.estimateTransaction}
	/>
{:else if store?.type !== 'init' && args.view === 'details' && store}
	<Details
		users={args.users}
		transaction={store.transaction}
		profile={args.profile}
		instanceId={args.instanceId}
		status={store.type}
	/>
{:else if args.view === 'amount'}
	<Amount
		bind:amount
		bind:token
		tokens={args.tokens}
		onViewChange={args.onViewChange}
		updateStore={args.updateStore}
	/>
{:else}
	<SelectUser
		bind:toUser
		users={args.users}
		profile={args.profile}
		onViewChange={args.onViewChange}
		view={args.view}
	/>
{/if}
