<script lang="ts">
	import Container from '$lib/components/container.svelte'

	export let title: string
</script>

<header class="header-wrapper">
	<Container>
		<div class="root">
			<div class="left">
				<slot name="left" />
			</div>
			<h1>{title}</h1>
			<div class="right">
				<slot name="right" />
			</div>
		</div>
	</Container>
</header>

<style lang="scss">
	.header-wrapper {
		position: sticky;
		top: 0;
		height: auto;
		background-color: var(--color-content-bg);
	}

	.root {
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
