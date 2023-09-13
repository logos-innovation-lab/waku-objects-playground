<script lang="ts">
	import type { DataMessage as DM, Store } from './schemas'
	import type { WakuObjectArgs } from '..'
	import type { DataMessage } from '$lib/stores/chat'
	import type { View } from './types'
	import Expense from './chat-messages/expense.svelte'
	import SettleReminder from './chat-messages/settle-reminder.svelte'
	import Payment from './chat-messages/payment.svelte'
	import { SPLIT_TOKEN } from '.'

	export let message: DataMessage<DM>
	export let args: WakuObjectArgs<Store, DM, View>

	$: myMessage = args.profile.address === message.fromAddress
	$: sender = args.users.find((u) => u.address === message.fromAddress)

	$: isSender = args.profile.address === sender?.address

	const token = SPLIT_TOKEN
</script>

{#if message.data.type === 'expense'}
	{@const expense = message.data.expense}
	<Expense
		{token}
		{expense}
		instanceId={message.instanceId}
		users={args.users}
		{sender}
		{isSender}
		{myMessage}
		chatName={args.chatName}
		onViewChange={args.onViewChange}
	/>
{:else if message.data.type === 'settle-reminder'}
	<SettleReminder
		{myMessage}
		instanceId={message.instanceId}
		profile={args.profile}
		balances={args.store?.balances || []}
		chatName={args.chatName}
		onViewChange={args.onViewChange}
	/>
{:else if message.data.type === 'payment'}
	<!-- FIXME: This is temporary, payment messages are not shown normally -->
	<Payment
		{myMessage}
		instanceId={message.instanceId}
		amount={message.data.payment.amount}
		{token}
		{sender}
	/>
{:else}
	<p>Unknown split object message</p>
	<p>Message: {JSON.stringify(message)}</p>
{/if}
