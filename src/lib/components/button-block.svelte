<script lang="ts">
	export let borderTop = false
	export let borderBottom = false
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class={`block-btn ${borderTop ? 'borderTop' : ''} ${borderBottom ? 'borderBottom' : ''} `}
	on:click
>
	<slot />
</div>

<style lang="scss">
	.block-btn {
		&:hover {
			cursor: pointer;
		}
	}
	.borderTop {
		border-top: var(--border);
	}
	.borderBottom {
		border-bottom: var(--border);
	}
</style>
