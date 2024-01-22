<script lang="ts">
	import { User } from 'carbon-icons-svelte'

	export let seed: string
	export let size = 48
	export let style = 'bottts-neutral'
	export let scale = 75
	export let radius = 50

	// FIXME: the carbon design icons have native sizes 16, 20, 24 and 32. We should stick to those
	const avatarSize = (size / 2) as unknown as 16 | 20 | 24 | 32
</script>

{#if style === 'user'}
	<User size={avatarSize} />
{:else}
	<img
		alt="avatar"
		src="https://api.dicebear.com/6.x/{style}/svg?seed={seed}&size={size}&radius={radius}&scale={scale}"
	/>
{/if}
