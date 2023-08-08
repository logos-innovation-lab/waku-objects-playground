<script lang="ts">
	import { onMount } from 'svelte'
	import { slide } from 'svelte/transition'
	import ButtonBlock from './button-block.svelte'
	import Container from './container.svelte'
	import Button from './button.svelte'
	import ChevronLeft from './icons/chevron-left.svelte'
	import Launch from './icons/launch.svelte'

	let detailId: string

	export let buttonLink: undefined | string = undefined

	onMount(() => {
		// Generates unique ID for this detail instance (used for ARIA attributes)
		detailId = `id-${Math.random().toString(36).substring(7)}`
	})

	let visible = false
</script>

<Container>
	<div class="toptab">
		<Container gap={12} grow justify="flex-start">
			<slot name="top" />
		</Container>
	</div>
	<div class="details">
		<!-- <Container gap={6} direction="column">
	</Container> -->
		<input
			type="checkbox"
			style="display: none;"
			bind:checked={visible}
			class={`${visible ? 'visible' : 'not visible'}`}
		/>
		<Container>
			<ButtonBlock on:click={() => (visible = !visible)} on:keypress={() => (visible = !visible)}>
				<p class={`text-bold details-trigger ${visible ? 'open' : 'closed'}`}>
					Details
					<Button variant="icon" align="right">
						<div class={`chevron`}>
							<ChevronLeft />
						</div>
					</Button>
				</p>
			</ButtonBlock>
		</Container>
		<Container padY={0} padX={24}>
			<div aria-expanded={visible} aria-controls={detailId}>
				{#if visible}
					<div
						class={`root`}
						aria-hidden={!visible}
						transition:slide={{ duration: 400 }}
						id={detailId}
					>
						<slot />
					</div>
					{#if buttonLink}
						<div class="view-btn">
							<Button
								on:click={() => window.open(`${defaultBlockchainNetwork.explorer}/tx/${buttonLink}`, '_blank')}
							>
								<Launch />
								View on Etherscan
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		</Container>
	</div>
</Container>

<style lang="scss">
	.toptab {
		background-color: var(--color-base);
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		margin-bottom: 1px;
	}

	.details {
		background-color: var(--color-base);
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}
	.details-trigger {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--font-size-normal);
		transition: font-size 0.3s;
	}
	.chevron {
		transform: rotate(-90deg);
		transition: transform 0.3s;
		font-size: 0;
	}

	.open {
		font-size: var(--font-size-lg);
		transition: font-size 0.3s;
		.chevron {
			transform: rotate(90deg);
			transition: transform 0.3s;
		}
	}
	.view-btn {
		text-align: center;
		margin-bottom: var(--spacing-12);
	}
</style>
