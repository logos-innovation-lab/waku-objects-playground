<script lang="ts">
	import type { WakuObjectArgs } from '..'
	import {
		SendTransactionStoreSchema,
		type SendTransactionStore,
		type SendTransactionDataMessage,
	} from './schemas'
	import type { Token } from '../schemas'
	import type { User } from '$lib/types'

	import Details from './views/details.svelte'
	import ChooseAmount from './views/choose-amount.svelte'
	import ConfirmSend from './views/confirm-send.svelte'
	import SelectUser from './views/select-user.svelte'

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

	$: isGroupchat = args.users.length !== 2

	// If this is private chat, set the user to which we want to send funds to the other user
	$: if (!isGroupchat && !args.view)
		toUser = args.users.find((u) => u.address !== args.profile.address)

	// Utility function which makes it easier to handle history for closing the object
	const exitObject = (depth: number) => () => history.go(isGroupchat ? -depth - 1 : -depth)
</script>

{#if args.view === 'overview' && toUser}
	<ConfirmSend
		{toUser}
		{token}
		{amount}
		profile={args.profile}
		send={args.send}
		sendTransaction={args.sendTransaction}
		estimateTransaction={args.estimateTransaction}
		exitObject={exitObject(3)}
	/>
{:else if args.view === 'details' && store}
	<Details
		users={args.users}
		transaction={store.transaction}
		profile={args.profile}
		instanceId={args.instanceId}
		status={store.type}
		exitObject={() => history.back()}
	/>
{:else if args.view === 'amount' || (args.view === undefined && !isGroupchat)}
	<ChooseAmount
		bind:amount
		bind:token
		tokens={args.tokens}
		exitObject={exitObject(2)}
		onViewChange={args.onViewChange}
	/>
{:else}
	<SelectUser
		bind:toUser
		users={args.users}
		profile={args.profile}
		exitObject={exitObject(1)}
		onViewChange={args.onViewChange}
	/>
{/if}
