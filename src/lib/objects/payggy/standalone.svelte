<script lang="ts">
	import type { WakuObjectArgs } from '..'
	import { SendTransactionStoreSchema, type SendTransactionStore } from './schemas'
	import type { TokenAmount } from '../schemas'
	import type { User } from '$lib/types'

	import Details from './views/details.svelte'
	import ChooseAmount from './views/choose-amount.svelte'
	import ConfirmSend from './views/confirm-send.svelte'
	import SelectUser from './views/select-user.svelte'
	import { isGroupChatId } from '$lib/stores/chat'

	export let args: WakuObjectArgs

	let store: SendTransactionStore | undefined

	$: {
		if (args.store) {
			const res = SendTransactionStoreSchema.safeParse(args.store)
			if (res.success) {
				store = res.data
			} else {
				args.addError({
					title: 'Payggy error',
					message: `Received wrong payggy object. ${res.error.message}`,
					ok: true,
				})
			}
		}
	}

	let token: TokenAmount
	let amount = ''
	let toUser: User | undefined = undefined

	$: isGroupchat = isGroupChatId(args.chatId)

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
		fiatRates={args.exchangeRates}
		fiatSymbol={args.fiatSymbol}
		addError={args.addError}
	/>
{:else if args.view === 'details' && store}
	<Details
		users={args.users}
		transaction={store.transaction}
		profile={args.profile}
		instanceId={args.instanceId}
		status={store.type}
		fiatRates={args.exchangeRates}
		fiatSymbol={args.fiatSymbol}
		exitObject={() => history.back()}
	/>
{:else if args.view === 'amount' || (args.view === undefined && !isGroupchat)}
	<ChooseAmount
		bind:amount
		bind:token
		tokens={args.tokens}
		exitObject={exitObject(2)}
		onViewChange={args.onViewChange}
		fiatRates={args.exchangeRates}
		fiatSymbol={args.fiatSymbol}
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
