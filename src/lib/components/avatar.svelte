<script lang="ts">
	import adapters from '$lib/adapters'
	import User from './icons/user.svelte'

	export let picture: string | undefined = undefined
	export let size = 48
	export let onClick: (() => unknown) | undefined = undefined
	export let avatarSize = size / 2
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class={`avatar ${onClick !== undefined ? 'click' : ''}`} on:click={onClick}>
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
		// margin: var(--spacing-12) 0px;
		border-radius: 100px;

		.img {
			aspect-ratio: 1;
			border-radius: 100px;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #c9c9c9;
			margin-inline: auto;
			position: relative;

			img {
				aspect-ratio: 1;
				object-fit: cover;
				border-radius: 100px;
			}
		}
	}
</style>
