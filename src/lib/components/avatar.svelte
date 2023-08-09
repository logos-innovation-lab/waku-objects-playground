<script lang="ts">
	import adapters from '$lib/adapters'
	import User from './icons/user.svelte'

	export let picture: string | undefined = undefined
	export let size = 48
	export let onClick: (() => unknown) | undefined = undefined
	export let avatarSize = size / 2
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
			<img src={adapters.getPicture(picture)} alt="profile" />
		{:else}
			<User size={avatarSize} />
		{/if}
	</div>
</div>

<style lang="scss">
	.click {
		cursor: pointer;
	}
	.avatar {
		border-radius: 100px;

		.img {
			aspect-ratio: 1;
			border-radius: 100px;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: var(--color-step-20, var(--color-dark-step-50));
			margin-inline: auto;
			position: relative;

			img {
				aspect-ratio: 1;
				object-fit: cover;
				border-radius: 100px;
			}
		}
		:global(svg) {
			fill: var(--color-step-50, var(--color-dark-step-10));
		}
	}
</style>
