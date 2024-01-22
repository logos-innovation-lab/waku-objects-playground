<script lang="ts">
	import { onMount } from 'svelte'
	import { slide } from 'svelte/transition'
	import { ChevronLeft, Launch } from 'carbon-icons-svelte'

	import ButtonBlock from './button-block.svelte'
	import Container from './container.svelte'
	import Button from './button.svelte'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'

	let detailId: string
	let visible = false

	export let txHash: undefined | string = undefined

	onMount(() => {
		// Generates unique ID for this detail instance (used for ARIA attributes)
		detailId = `id-${Math.random().toString(36).substring(7)}`
	})
</script>

<Container>
	<div class="toptab">
		<Container gap={12} grow justify="flex-start">
			<slot name="top" />
		</Container>
	</div>
	<div class="details">
		<input
			type="checkbox"
			style="display: none;"
			bind:checked={visible}
			class={`${visible ? 'visible' : 'not visible'}`}
		/>
		<Container>
			<ButtonBlock on:click={() => (visible = !visible)} on:keypress={() => (visible = !visible)}>
				<p class={`details-trigger ${visible ? 'open' : 'closed'}`}>
					Details
					<Button variant="icon" align="right">
						<div class={`chevron`}>
							<ChevronLeft />
						</div>
					</Button>
				</p>
			</ButtonBlock>
		</Container>
		<Container padY={0} padX={12}>
			<div aria-expanded={visible} aria-controls={detailId}>
				{#if visible}
					<div
						class={`root`}
						aria-hidden={!visible}
						transition:slide={{ duration: 400 }}
						id={detailId}
					>
						<slot />
						{#if txHash && defaultBlockchainNetwork.explorer}
							<div class="view-btn">
								<Button
									on:click={() =>
										window.open(`${defaultBlockchainNetwork.explorer?.url}/tx/${txHash}`, '_blank')}
								>
									<Launch />
									View on {defaultBlockchainNetwork.explorer.name}
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</Container>
	</div>
</Container>

<style lang="scss">
	.toptab {
		background-color: var(--color-base, var(--color-dark-accent));
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		margin-bottom: 1px;
	}

	.details {
		background-color: var(--color-base, var(--color-dark-accent));
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}
	.details-trigger {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--font-size-normal);
		font-weight: var(--font-wright-400);
		transition: font-size 0.3s, font-weight 0.3s;
	}
	.chevron {
		transform: rotate(-90deg);
		transition: transform 0.3s;
		font-size: 0;
	}

	.open {
		.chevron {
			transform: rotate(90deg);
			transition: transform 0.3s;
		}
	}
	.view-btn {
		text-align: center;
		padding-bottom: var(--spacing-12);
	}
</style>
