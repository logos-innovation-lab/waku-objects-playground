<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from 'svelte'
	import { browser } from '$app/environment'

	const dispatch = createEventDispatcher()

	let cls: string | undefined = undefined
	export { cls as class }
	export let disabled: boolean | undefined = undefined
	export let up: boolean | undefined = undefined

	let showDropdown = false
	let dropdownElement: HTMLElement

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
	})

	onDestroy(() => {
		if (browser && window) window.removeEventListener('click', closeDropdown)
	})

	// Trigger event when dropdown is opened or closed
	$: showDropdown ? dispatch('open') : dispatch('close')
</script>

<div bind:this={dropdownElement} class="dropdown">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div on:click={() => !disabled && (showDropdown = !showDropdown)}>
		<slot name="button" disabled />
	</div>

	<div class={`root ${cls}`}>
		<ul class={`${showDropdown ? '' : 'hidden'} ${up ? 'up' : ''} ${cls}`}>
			<slot />
		</ul>
	</div>
</div>

<style lang="scss">
	.root {
		position: relative;

		ul {
			position: absolute;
			inset: 100% 0 auto auto;
			width: max-content;
			max-width: 450px;
			z-index: 100;
			overflow: hidden;

			&.hidden {
				display: none;
			}

			&.up {
				inset: auto auto 48px 0;
			}
		}
	}
</style>
