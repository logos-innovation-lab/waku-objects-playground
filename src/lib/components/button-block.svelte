<script lang="ts">
	export let borderTop = false
	export let borderBottom = false
</script>

<div
	class={`block-btn ${borderTop ? 'borderTop' : ''} ${borderBottom ? 'borderBottom' : ''} `}
	on:click
	on:keypress
	role="button"
	tabindex={0}
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
