<script lang="ts">
	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'

	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'
	import CaretDown from '$lib/components/icons/caret-down.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { fiatSymbolList, preferences } from '$lib/stores/preferences'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Preferences">
			<Button slot="left" variant="icon" on:click={() => goto(routes.IDENTITY)}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<AuthenticatedOnly>
		<Container padY={12}>
			<Dropdown label="Mode">
				<Button grow align="block" slot="button">
					{$preferences.fiatSymbol}
					<CaretDown />
				</Button>
				{#each fiatSymbolList as fiatSymbol}
					<DropdownItem onClick={() => preferences.setFiatSymbol(fiatSymbol)}
						>{fiatSymbol}</DropdownItem
					>
				{/each}
			</Dropdown>
		</Container>
	</AuthenticatedOnly>
</Layout>
