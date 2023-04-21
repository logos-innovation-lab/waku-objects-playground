<script lang="ts">
	import type { IconProps } from '$lib/types'

	type $$Props = IconProps

	let cls: string | undefined = undefined
	export { cls as class }
	export let size = 20
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} class={cls}>
	<circle cx="8" cy="16" r="2" />
	<circle cx="16" cy="16" r="2" />
	<circle cx="24" cy="16" r="2" />
</svg>
