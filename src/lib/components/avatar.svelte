<script lang="ts">
	import { getPicture } from '$lib/adapters/ipfs'
	import Dicebear from './dicebear.svelte'

	export let picture: string | undefined
	export let size = 48
	export let onClick: (() => unknown) | undefined = undefined

	function isCID(s: string) {
		return s.length === 46 && s.startsWith('Qm')
	}
</script>

<div
	class={`avatar ${onClick !== undefined ? 'click' : ''}`}
	on:click={onClick}
	on:keypress={onClick}
	role="button"
	tabindex={0}
>
	<div class="img" style={`height: ${size}px;`}>
		{#if picture && isCID(picture)}
			<img src={getPicture(picture)} alt="profile" />
		{:else if picture}
			<Dicebear name={picture || ''} {size} />
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
