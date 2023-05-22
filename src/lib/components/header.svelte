<script lang="ts">
	// import { onDestroy, onMount, createEventDispatcher } from 'svelte'

	// const dispatch = createEventDispatcher()

	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input.svelte'
	import Search from '$lib/components/icons/search.svelte'
	import Button from '$lib/components/button.svelte'

	export let title = ''
	export let search = false
	export let showSearch = false

	// $: showSearch ? dispatch('open') : dispatch('close')
</script>

<header class={`header-wrapper ${search ? 'search' : ''}`}>
	<Container>
		<div class="white" />
		<div class="root">
			<div class="left">
				<slot name="left" />
				{#if search}
					<div class={`search-icon ${showSearch ? 'bg' : ''}`}>
						<Button variant="icon" on:click={() => (showSearch = !showSearch)}>
							<Search size={24} />
						</Button>
					</div>
				{/if}
			</div>
			<h1 class="text-normal">{title}</h1>
			<div class="right">
				<slot name="right" />
			</div>
		</div>
		<div class={`search-input ${showSearch ? 'show' : ''}`}>
			<Input placeholder="Search" />
		</div>
	</Container>
</header>

<style lang="scss">
	.header-wrapper {
		position: sticky;
		top: 0;
		height: auto;
		background-color: var(--white);
		border-bottom: 1px solid var(--gray20);
		z-index: 100;
	}

	.white {
		position: absolute;
		content: '';
		background-color: var(--white);
		top: 0;
		left: 0;
		right: 0;
		height: 64px;
		z-index: 20;
	}

	.root {
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-12);
		background-color: var(--white);
		z-index: 30;

		h1 {
			flex-grow: 1;
			text-align: center;
			font-weight: var(--font-weight-500);
		}

		.left,
		.right {
			flex-basis: 42px;
		}

		.right {
			display: inline-flex;
			justify-content: flex-end;
		}

		.left {
			display: flex;
			gap: var(--spacing-12);
			flex-direction: row;
			justify-content: flex-start;
			align-items: center;
		}
	}

	.search-icon {
		border-radius: var(--border-radius);
		overflow: hidden;
		background-color: var(--transparent);
		transition: background-color 0.2s;
		z-index: 50;

		&.bg {
			background-color: var(--gray20);
		}
	}

	.search-input {
		position: sticky;
		margin-top: -68px;
		z-index: 10;
		padding-top: var(--spacing-12);
		transition: margin-top 0.2s, opacity 0.2s;

		&.show {
			margin-top: 0;
		}
	}
</style>
