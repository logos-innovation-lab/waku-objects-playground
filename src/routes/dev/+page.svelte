<script lang="ts">
	import { browser } from '$app/environment'

	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Button from '$lib/components/button.svelte'
	import Dicebear from '$lib/components/dicebear.svelte'
	import routes from '$lib/routes'
	import { goto } from '$app/navigation'
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	let style = getStyle() || 'user'

	const dicebearStyles = [
		'user',
		// "adventurer",
		// "adventurer-neutral",
		// "avataaars",
		'avataaars-neutral',
		// "big-ears",
		'big-ears-neutral',
		// "big-smile",
		// "bottts",
		'bottts-neutral',
		// "croodles",
		// "croodles-neutral",
		'fun-emoji',
		'icons',
		'identicon',
		// "initials",
		// "lorelei",
		// "lorelei-neutral",
		// "micah",
		// "miniavs",
		// "notionists",
		// "notionists-neutral",
		// "open-peeps",
		// "personas",
		// "pixel-art",
		'pixel-art-neutral',
		// "shapes",
		// "thumbs",
	]

	function setStyle(s: string) {
		style = s
		localStorage?.setItem('dicebearStyle', style)
	}

	function getStyle() {
		if (!browser || !localStorage) {
			console.error('Error getting from local storage: not in browser')
			return
		}
		return localStorage.getItem('dicebearStyle')
	}
</script>

<Header title="DEV DASHBOARDp">
	<svelte:fragment slot="left">
		<div class="header-btns">
			<Button variant="icon" on:click={() => goto(routes.HOME)}>
				<ChevronLeft />
			</Button>
		</div>
	</svelte:fragment>
</Header>

<Container>
	<section>
		<div class="label">Network</div>
		<div class="value">{defaultBlockchainNetwork.name}</div>
	</section>
	<section>
		<Dropdown>
			<Button slot="button">
				Dicebear style: {style}
			</Button>
			{#each dicebearStyles as style}
				<DropdownItem onClick={() => setStyle(style)}
					><Dicebear name={'hello'} {style} size={48} />{style}</DropdownItem
				>
			{/each}
		</Dropdown>
	</section>
</Container>

<style lang="scss">
	section {
		margin-top: 1rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.label {
		font-family: var(--font-body);
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--color-step-50, var(--color-dark-step-10));
		margin-bottom: var(--spacing-4);
	}

	.value {
		font-family: var(--font-serif);
	}
</style>
