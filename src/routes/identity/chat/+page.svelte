<script lang="ts">
	import ChevronLeft from '$lib/components/icons/chevron-left.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Divider from '$lib/components/divider.svelte'

	import { profile } from '$lib/stores/profile'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import CaretDown from '$lib/components/icons/caret-down.svelte'
	import { theme } from '$lib/stores/theme'

	let baseColor = $theme.baseColor
	$: if (/^#[0-9A-F]{6}$/i.test(baseColor)) {
		theme.setColor(baseColor)
	}
</script>

<Header title="Account">
	<Button slot="left" variant="icon" on:click={() => goto(routes.IDENTITY)}>
		<ChevronLeft />
	</Button>
</Header>
{#if $profile.loading}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Loading...</h2>
	</Container>
{:else if $profile.error}
	<Container align="center" grow gap={6} justify="center" padX={24}>
		<h2>Failed to load profile: {$profile.error.message}</h2>
	</Container>
{:else}
	<div class="color">
		<div class="white" />
		<div>--white</div>
	</div>
	<div class="color">
		<div class="ultra-light" />
		<div>--ultra-light</div>
	</div>
	<div class="color">
		<div class="light" />
		<div>--light</div>
	</div>
	<div class="color">
		<div class="mid" />
		<div>--mid</div>
	</div>
	<div class="color">
		<div class="dark" />
		<div>--dark</div>
	</div>
	<div class="color">
		<div class="ultra-dark" />
		<div>--ultra-dark</div>
	</div>
	<div class="color">
		<div class="black" />
		<div>--black</div>
	</div>
	<Divider pad={12} />
	<Dropdown>
		<Button grow align="block" slot="button">{$theme.darkMode} <CaretDown /></Button>
		<DropdownItem onClick={() => theme.setDarkMode('system')}>Automatic</DropdownItem>
		<DropdownItem onClick={() => theme.setDarkMode('dark')}>Dark</DropdownItem>
		<DropdownItem onClick={() => theme.setDarkMode('light')}>Light</DropdownItem>
	</Dropdown>

	<input type="text" bind:value={baseColor} />
	<input type="color" bind:value={baseColor} />
{/if}

<style lang="scss">
	.color {
		display: flex;
		flex-direction: row;
		align-items: center;
		> div {
			width: 50px;
			height: 50px;
			border-radius: 50%;
		}
	}

	.white {
		background-color: var(--color-base);
	}
	.ultra-light {
		background-color: var(--color-step-10);
	}
	.light {
		background-color: var(--color-step-20);
	}
	.mid {
		background-color: var(--color-step-30);
	}
	.dark {
		background-color: var(--color-step-40);
	}
	.ultra-dark {
		background-color: var(--color-step-50);
	}
	.black {
		background-color: var(--color-accent);
	}
</style>
