<script lang="ts">
	import Container from '$lib/components/container.svelte'
	import { toSignificant } from '$lib/utils/format'
	export let name: string
	export let token: string
	export let amount: bigint
	export let decimals: number
	export let image: string | undefined = undefined
</script>

<div class="asset root">
	<Container justify="space-between" align="center" alignItems="center" direction="row">
		<div class="token">
			<img src={image} alt={`${name} logo`} width="64" height="64" />
			<span class="text-lg text-bold">
				{name}
			</span>
		</div>
		<div class="text-lg">
			{toSignificant(amount, decimals)}
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
		border-bottom: 1px solid var(--color-step-20);

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
