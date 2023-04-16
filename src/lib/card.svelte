<script lang="ts">
	export let image: string
	export let title: string
	export let description: string
</script>

<div class="root grow">
	<div class="row">
		<div class="img">
			<img src={image} alt="waku object" />
		</div>
		<div class="column grow">
			<div class="row">
				<h2>{title}</h2>
				<slot />
			</div>
			<span class="description">{description}</span>
		</div>
	</div>
</div>

<style>
	.root {
		border: 1px solid var(--color-border);
		padding: var(--spacing-12);
	}
	.img {
		background-color: #eee;
		width: 60px;
		height: 60px;
		margin-right: var(--spacing-12);
		flex-shrink: 0;
	}
	.description {
		margin-top: var(--spacing-6);
	}
	.row {
		display: flex;
		flex-direction: row;
	}
	.column {
		display: flex;
		flex-direction: column;
	}
	.grow {
		flex-grow: 1;
	}
</style>
