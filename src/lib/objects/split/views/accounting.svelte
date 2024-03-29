<script lang="ts">
	import { Bullhorn, Renew, ChevronLeft, Close } from 'carbon-icons-svelte'

	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Container from '$lib/components/container.svelte'
	import Avatar from '$lib/components/avatar.svelte'
	import Divider from '$lib/components/divider.svelte'
	import Layout from '$lib/components/layout.svelte'

	import type { User as UserType } from '$lib/types'
	import type { Balance, DataMessage } from '../schemas'
	import { toSignificant } from '$lib/utils/format'
	import type { View } from '../types'
	import type { Token } from '$lib/objects/schemas'
	import type { ErrorDescriptor } from '$lib/stores/error'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	export let users: UserType[]
	export let profile: UserType
	export let balances: Balance[]
	export let token: Token

	export let exitObject: () => void
	export let send: (message: DataMessage) => Promise<void>
	export let onViewChange: (view: View, ...rest: string[]) => void
	export let addError: (error: ErrorDescriptor) => void

	const usersAmounts = balances.map(({ address, amount }) => ({
		user: users.find((user) => publicKeyToAddress(user.publicKey) === address),
		amount: BigInt(amount),
	}))
	let userAmount = 0n
	$: {
		const balance = balances.find(
			({ address }) => address === publicKeyToAddress(profile.publicKey),
		)
		if (balance) {
			userAmount = BigInt(balance.amount)
		}
	}

	function settleNow() {
		onViewChange('settle')
	}

	async function askToSettle() {
		try {
			await send({
				type: 'settle-reminder',
			})

			exitObject()
		} catch (error) {
			addError({
				title: 'Splitter error',
				message: `Failed to send settle reminder. ${(error as Error).message}`,
				ok: true,
			})
		}
	}
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
	<Container grow>
		<ul>
			{#each usersAmounts as { user, amount }}
				{@const isYou = user?.publicKey === profile.publicKey}
				<li>
					<Container grow>
						<div class="chat">
							<Avatar size={48} picture={user?.avatar} seed={user?.publicKey} />
							<Container direction="column">
								<p>
									{(isYou ? 'You' : user?.name) ?? 'unknown'}
								</p>
								<p>
									{#if amount < 0n}
										lent {toSignificant(-amount, token.decimals)} {token.symbol}
									{:else if amount > 0n}
										owe{isYou ? '' : 's'} {toSignificant(amount, token.decimals)} {token.symbol}
									{:else}
										settled
									{/if}
								</p>
							</Container>
						</div>
					</Container>
				</li>
			{/each}
		</ul>
	</Container>
	<Divider />
	<Container gap={12} padX={24} padY={24} justify="center" alignItems="center">
		{#if userAmount < 0}
			<p>Overall you lent</p>
			<h1>{toSignificant(-userAmount, token.decimals)} {token.symbol}</h1>
			<Button variant="strong" on:click={askToSettle}><Bullhorn /> Ask to settle</Button>
		{:else if userAmount > 0}
			<p>Overall you owe</p>
			<h1>{toSignificant(userAmount, token.decimals)} {token.symbol}</h1>
			<Button variant="strong" on:click={settleNow}><Renew /> Settle now</Button>
		{:else}
			<p>\(•◡•)/</p>
			<h1>Settled up</h1>
		{/if}
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
</style>
