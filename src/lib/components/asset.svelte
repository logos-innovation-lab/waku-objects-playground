<script lang="ts">
	import Container from '$lib/components/container.svelte'
	export let name = ''
	export let token = ''
	export let amount = 0
</script>

<div class="asset root">
	<Container justify="space-between" align="center" alignItems="center" direction="row">
		<div class="token">
			<img src="https://picsum.photos/48/48" alt={`${name} logo`} />
			<span class="text-lg text-bold">
				{name}
			</span>
		</div>
		<div class="text-lg">
			{amount}
			{token}
		</div>
	</Container>
</div>

<style lang="scss">
	.asset {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: var(--border);
		border-bottom: 1px solid var(--gray20);

		.token {
			display: flex;
			align-items: center;
			gap: var(--spacing-12);
		}

		img {
			border-radius: var(--border-radius);
		}
	}
</style>
