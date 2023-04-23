<script lang="ts">
	export let title: string
</script>

<header class="root">
	<div class="left">
		<slot name="left" />
	</div>
	<h1>{title}</h1>
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

		.right {
			display: flex;
			justify-content: flex-end;
		}
	}
</style>
