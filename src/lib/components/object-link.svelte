<script lang="ts">
	import Container from './container.svelte'

	export let imgSrc: string | undefined = undefined
	export let imgAlt: string | undefined = undefined
	export let title: string | undefined = undefined
	export let description: string | undefined = undefined
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class={`object`} on:click>
	<Container direction="row" gap={12} alignItems="center">
		<img class="img" src={imgSrc} alt={imgAlt} />
		<p>
			<span class="text-bold text-lg">{title}</span>
			{description}
		</p>
	</Container>
</div>

<style lang="scss">
	.object {
		background-color: var(--white);
		border-radius: var(--border-radius);

		.img {
			width: 72px;
		}
		img {
			width: 72px;
			height: 72px;
			aspect-ratio: 1;
			border-radius: 18px;
		}
		span {
			display: block;
		}
		p {
			flex-grow: 1;
		}

		&:hover {
			cursor: pointer;
		}
	}
</style>
