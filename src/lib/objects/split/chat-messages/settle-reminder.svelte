<script lang="ts">
	import type { Balance } from '../schemas'
	import Container from '$lib/components/container.svelte'
	import DataViewAlt from '$lib/components/icons/data-view-alt.svelte'
	import ObjectHeader from '$lib/components/object-header.svelte'
	import ReadonlyText from '$lib/components/readonly-text.svelte'
	import { splitDescriptor } from '..'
	import Button from '$lib/components/button.svelte'
	import type { View } from '../types'
	import type { User } from '$lib/types'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import Renew from '$lib/components/icons/renew.svelte'
	import { publicKeyToAddress } from '$lib/adapters/waku/crypto'

	export let instanceId: string
	export let profile: User
	export let myMessage: boolean
	export let chatName: string
	export let balances: Balance[]

	export let onViewChange: (view: View, ...rest: string[]) => void

	let owedAmount = 0n
	$: {
		const balance = balances.find(
			({ address }) => address === publicKeyToAddress(profile.publicKey),
		)
		if (balance) {
			owedAmount = BigInt(balance.amount)
		}
	}

	function settleNow() {
		onViewChange('settle')
	}
</script>

{#if myMessage}
	<ChatMessage {myMessage} object bubble>
		<p>You asked to settle up</p>
	</ChatMessage>
{:else if owedAmount > 0n}
	<ChatMessage object bubble>
		<div class="wo text-normal">
			<Container gap={12}>
				<ObjectHeader
					name={splitDescriptor.name}
					logoImg={splitDescriptor.logo}
					logoAlt={`${splitDescriptor.name} logo`}
				/>
				You owe some money, please take time to settle!

				<Container padY={0} padX={0}>
					<ReadonlyText
						clickable
						label={`${splitDescriptor.name} #${instanceId.slice(0, 4)}`}
						marginBottom={0}
					>
						<div
							class="readonly"
							on:click={() => onViewChange('collection')}
							on:keypress={() => onViewChange('collection')}
							role="button"
							tabindex={0}
						>
							<div class="grow">{chatName} shared expenses</div>
							<div class="change-view">
								<DataViewAlt />
							</div>
						</div>
					</ReadonlyText>
				</Container>
				<Button variant="strong" on:click={settleNow}><Renew /> Settle now</Button>
			</Container>
		</div>
	</ChatMessage>
{:else if owedAmount <= 0n}
	<!-- TODO: this likely should not be displayed if I am owed something (owedAmount < 0n) -->
	<ChatMessage {myMessage} object bubble>
		<p>All settled</p>
	</ChatMessage>
{/if}

<style lang="scss">
	.wo {
		display: flex;
		flex-direction: column;
		font-family: var(--font-body);
		font-style: normal;
		text-align: left;
	}

	.readonly {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing-6);

		.grow {
			flex-grow: 1;
			font-weight: 500;
		}
	}

	.change-view {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
	}
</style>
