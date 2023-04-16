<header class="root">
	<div>
		<slot name="left" />
	</div>
	<div>
		<slot />
	</div>
	<div>
		<slot name="right" />
	</div>
</header>

<style>
	.root {
		position: sticky;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-24);
	}
	.root > div:first-child,
	.root > div:last-child {
		flex-basis: 48px;
	}
</style>
