<script lang="ts">
	import Container from './container.svelte'

	export let imgSrc: string | undefined = undefined
	export let imgAlt: string | undefined = undefined
	export let title: string | undefined = undefined
	export let description: string | undefined = undefined
</script>

<Container padX={0} padY={0}>
	<div class={`object`} on:click on:keypress role="button" tabindex={0}>
		<img class="img" src={imgSrc} alt={imgAlt} />
		<p>
			<span class="text-bold text-lg">{title}</span>
			{description}
		</p>
	</div>
</Container>

<style lang="scss">
	.object {
		background-color: var(--color-base);
		border-radius: var(--border-radius);
		display: flex;
		flex-direction: row;
		gap: var(--spacing-12);
		justify-content: center;
		align-items: flex-start;
		padding: var(--spacing-12);

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
