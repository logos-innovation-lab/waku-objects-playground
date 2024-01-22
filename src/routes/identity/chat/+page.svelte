<script lang="ts">
	import { ChevronLeft, ColorPalette, CaretDown } from 'carbon-icons-svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'
	import Dropdown from '$lib/components/dropdown.svelte'
	import ChatMessage from '$lib/components/chat-message.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Spacer from '$lib/components/spacer.svelte'
	import InputField from '$lib/components/input-field.svelte'

	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import { theme } from '$lib/stores/theme'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import Layout from '$lib/components/layout.svelte'

	let baseColor = $theme.baseColor
	$: if (/^#[0-9A-F]{6}$/i.test(baseColor)) {
		theme.setColor(baseColor)
	}
</script>

<Layout>
	<svelte:fragment slot="header">
		<Header title="Chat appearance">
			<Button slot="left" variant="icon" on:click={() => goto(routes.IDENTITY)}>
				<ChevronLeft />
			</Button>
		</Header>
	</svelte:fragment>
	<AuthenticatedOnly>
		<div class="preview">
			<Container>
				<ChatMessage bubble>This is a preview, use the menus below to customise</ChatMessage>
				<ChatMessage bubble myMessage>Hey this is really nice!</ChatMessage>
			</Container>
		</div>
		<Spacer height={12} />
		<Container padY={12}>
			<Dropdown label="Mode">
				<Button grow align="block" slot="button">
					{#if $theme.darkMode === 'system'}
						Automatic
					{:else if $theme.darkMode === 'dark'}
						Dark
					{:else}
						Light
					{/if}
					<CaretDown />
				</Button>
				<DropdownItem onClick={() => theme.setDarkMode('system')}>Automatic</DropdownItem>
				<DropdownItem onClick={() => theme.setDarkMode('dark')}>Dark</DropdownItem>
				<DropdownItem onClick={() => theme.setDarkMode('light')}>Light</DropdownItem>
			</Dropdown>
		</Container>
		<Container direction="row" gap={12}>
			<div class="grow">
				<InputField bind:value={baseColor} />
			</div>
			<label>
				<div class="palette-overlay" />
				<div class="palette-icon">
					<ColorPalette />
				</div>
				<input type="color" bind:value={baseColor} />
			</label>
		</Container>
	</AuthenticatedOnly>
</Layout>

<style lang="scss">
	.preview {
		background-color: var(--color-step-10, var(--color-dark-step-50));
	}

	label {
		position: relative;
		line-height: 0;
		cursor: pointer;
		border-radius: 50%;
		overflow: hidden;
		background-color: transparent;
		width: 48px;
		height: 48px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	input[type='color'] {
		border-radius: 50%;
		width: 50px;
		height: 50px;
		border: none;
		background-color: transparent;
		flex-shrink: 0;
	}

	::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	::-webkit-color-swatch {
		border-radius: 50%;
		border: none;
	}

	.palette-icon {
		position: absolute;
		inset: 50% auto auto 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
		line-height: 0;

		:global(svg) {
			fill: var(--color-base, var(--color-dark-base));
		}
	}

	.palette-overlay {
		position: absolute;
		inset: 50% auto auto 50%;
		transform: translate(-50%, -50%);
		z-index: 5;
		background-color: rgba(0, 0, 0, 0.25);
		border-radius: 50%;
		height: 32px;
		width: 32px;
	}

	.grow {
		flex-grow: 1;
	}
</style>
