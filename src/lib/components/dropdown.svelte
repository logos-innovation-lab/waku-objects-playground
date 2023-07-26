<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from 'svelte'
	import { browser } from '$app/environment'

	const dispatch = createEventDispatcher()

	export let disabled: boolean | undefined = undefined
	export let up: boolean | undefined = undefined
	export let left: boolean | undefined = false
	export let label: undefined | string = undefined

	let showDropdown = false
	let dropdownElement: HTMLElement
	let dropdownId: string

	const closeDropdown = (ev: MouseEvent) => {
		const target = ev.target as unknown as Node
		if (dropdownElement.contains(target)) {
			// Clicked on the dropdown button or inside the dropdown
		} else {
			// Clicked outside the dropdown
			showDropdown = false
		}
	}

	onMount(() => {
		if (browser && window) window.addEventListener('click', closeDropdown)

		// Generates unique ID for this dropdown instance (used for ARIA attributes)
		dropdownId = `dropdown-${Math.random().toString(36).substring(7)}`
	})

	onDestroy(() => {
		if (browser && window) window.removeEventListener('click', closeDropdown)
	})

	// Trigger event when dropdown is opened or closed
	$: showDropdown ? dispatch('open') : dispatch('close')

	function onClick() {
		if (!disabled) showDropdown = !showDropdown
	}
</script>

<div
	bind:this={dropdownElement}
	class="dropdown"
	role="combobox"
	aria-haspopup="listbox"
	aria-expanded={showDropdown}
	aria-controls={dropdownId}
>
	{#if label}
		<div class="label">
			{label}
		</div>
	{/if}
	<div on:click={onClick} on:keypress={onClick} role="button" tabindex={0}>
		<slot name="button" disabled />
	</div>

	<div class={`root`} aria-hidden={!showDropdown}>
		<ul
			class={`${showDropdown ? '' : 'hidden'} ${up ? 'up' : ''} ${left ? 'left' : ''}`}
			id={dropdownId}
			role="listbox"
			aria-labelledby="dropdown-button"
		>
			<slot />
		</ul>
	</div>
</div>

<style lang="scss">
	.root {
		position: relative;

		ul {
			position: absolute;
			inset: calc(100% + var(--spacing-6)) 0 auto auto;
			width: max-content;
			max-width: 450px;
			z-index: 100;
			overflow: hidden;
			border-radius: var(--border-radius);
			box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.25);
			backdrop-filter: blur(var(--blur));

			&.hidden {
				display: none;
			}

			&.up {
				inset: auto 0 50px auto;
			}

			&.left {
				inset: auto auto 50px 0;
			}
		}
	}
	.label {
		font-size: var(--font-size-sm);
		// color: rgba(var(--color-step-50-rgb), 0.5);
		color: var(--color-step-40);
		margin-left: var(--spacing-12);
	}
</style>
