<script lang="ts">
	import { afterUpdate } from 'svelte'

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

	function resize() {
		// The empty value check needs to be there to ensure correct resizing as sometimes scrollHeight can stay bigger than the actual content
		const newHeight = Math.max(height, placeholderHeight, value === '' ? 0 : textarea.scrollHeight)
		textarea.style.height = `${newHeight + 2}px`
	}

	afterUpdate(() => {
		resize()
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
		color: var(--dark);
		background-color: transparent;

		span {
			margin-left: var(--spacing-12);
			text-align: left;
		}

		::placeholder {
			color: var(--dark);
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
			color: rgba(var(--ultra-dark), 0.5);
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
		border: 1px solid var(--light);
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
			background-color: var(--ultra-light);
			border-color: transparent;
		}

		&.content {
			position: static;
			width: 100%;
		}
	}
</style>
