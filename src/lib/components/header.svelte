<script lang="ts">
</script>

<header class="root">
	{#if $$slots.left}
		<div class="left">
			<slot name="left" />
		</div>
	{/if}
	<div>
		<slot />
	</div>
	<div class="right">
		<slot name="right" />
	</div>
</header>

<style lang="scss">
	.root {
		position: sticky;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-block: var(--spacing-24);
		gap: var(--spacing-12);

		.left,
		.right {
			flex-basis: 42px;
		}
	}
</style>
