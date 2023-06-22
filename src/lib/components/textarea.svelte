<script lang="ts">
	import { onDestroy, onMount } from 'svelte'

	export let label = ''
	export let value = ''
	export let placeholder = ''
	export let autofocus = false
	export let disabled = false
	export let readonly = false
	export let pad = 0
	export let height = 46

	let placeholderHeight: number
	let textarea: HTMLTextAreaElement

	const resizeEvents = ['change']
	const delayedResizeEvents = ['change', 'cut', 'paste', 'drop', 'keydown']

	function resize() {
		textarea.style.height = `${height}px`
		textarea.style.height = `${Math.max(placeholderHeight, textarea.scrollHeight) + 2}px`
	}

	function delayedResize() {
		setTimeout(resize, 0)
	}

	// The resize mechanism is heavily inspired by https://stackoverflow.com/a/5346855
	onMount(() => {
		resizeEvents.forEach((eventName) => textarea.addEventListener(eventName, resize))
		delayedResizeEvents.forEach((eventName) => textarea.addEventListener(eventName, delayedResize))
		resize()
	})

	// This cleans up all the listeners from the textarea element when the component is about to be destroyed
	onDestroy(() => {
		if (!textarea) return

		resizeEvents.forEach((eventName) => textarea.removeEventListener(eventName, resize))
		delayedResizeEvents.forEach((eventName) =>
			textarea.removeEventListener(eventName, delayedResize),
		)
	})
</script>

<label class="label text-lg" style={`padding-block: ${pad}px`}>
	{#if label !== ''}
		<span class="text-sm">{label}</span>
	{/if}
	<div class="area-placeholder text-lg">
		<div
			bind:clientHeight={placeholderHeight}
			class={`text-lg placeholder-text ${value != '' ? 'hide' : ''} `}
		>
			{placeholder}
		</div>
		<!-- svelte-ignore a11y-autofocus -->
		<textarea
			bind:value
			bind:this={textarea}
			on:keydown
			on:keypress
			on:keyup
			class={`text-lg ${value != '' ? 'content' : ''}`}
			{disabled}
			{autofocus}
			{placeholder}
			{readonly}
			rows="1"
		/>
	</div>
</label>

<style lang="scss">
	label.label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-6);
		width: 100%;
		color: var(--gray40);
		background-color: transparent;

		span {
			margin-left: var(--spacing-12);
			text-align: left;
		}

		::placeholder {
			color: var(--gray40);
		}
	}

	.area-placeholder {
		position: relative;
		width: 100%;
		height: fit-content;
		border-radius: var(--border-radius);
		line-height: 1px;

		.placeholder-text {
			position: absolute;
			opacity: 0;
			font-size: var(--font-size-lg);
			color: var(--grey-300);
			width: 100%;
			height: fit-content;
			min-height: 48px;
			padding: var(--spacing-12);
			text-align: left;
			line-height: 24px;

			&.hide {
				display: none;
			}
		}
	}
	textarea {
		border: none;
		resize: none;
		border: 1px solid var(--gray20);
		border-radius: var(--border-radius);
		padding: 11px var(--spacing-12);
		max-height: 120px;
		min-height: 48px;
		width: 100%;

		&:focus,
		&.content {
			outline: none;
			color: var(--black);
		}

		&:disabled,
		&:read-only {
			background-color: var(--gray10);
			border-color: transparent;
		}

		&.content {
			position: static;
			width: 100%;
		}
	}
</style>
