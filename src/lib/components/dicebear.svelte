<script lang="ts">
	import User from './icons/user.svelte'

	export let name: string
	export let size = 48
	export let style = localStorage.getItem('dicebearStyle') || 'user'
	export let scale = 75
	export let radius = 50

	const seed = name
	const avatarSize = size / 2
</script>

{#if style === 'user'}
	<User size={avatarSize} />
{:else}
	<img
		alt="avatar"
		src="https://api.dicebear.com/6.x/{style}/svg?seed={seed}&size={size}&radius={radius}&scale={scale}"
	/>
{/if}
