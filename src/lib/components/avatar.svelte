<script lang="ts">
	import { getPicture } from '$lib/adapters/ipfs'
	import Dicebear from './dicebear.svelte'

	export let picture: string | undefined
	export let seed: string | undefined
	export let size = 48
	export let onClick: (() => unknown) | undefined = undefined
	export let group = false
</script>

<div
	class={`avatar ${onClick !== undefined ? 'click' : ''}`}
	on:click={onClick}
	on:keypress={onClick}
	role="button"
	tabindex={0}
>
	<div class="img" style={`height: ${size}px;`}>
		{#if picture}
			<img src={getPicture(picture)} alt="profile" />
		{:else if seed}
			{@const style = group ? 'shapes' : 'bottts-neutral'}
			<Dicebear {seed} {size} {style} />
		{/if}
	</div>
</div>

<style>
	.click {
		cursor: pointer;
	}

	.avatar {
		border-radius: 100px;
	}

	.img {
		aspect-ratio: 1;
		border-radius: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--color-step-40, var(--color-dark-step-20));
		margin-inline: auto;
		position: relative;
	}

	:global(.avatar svg) {
		fill: var(--color-step-10, var(--color-dark-step-50));
	}

	img {
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 100px;
	}
</style>
