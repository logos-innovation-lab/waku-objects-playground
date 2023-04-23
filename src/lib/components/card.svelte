<script lang="ts">
	export let image: string | undefined = undefined
	export let title: string | undefined = undefined
	export let description: string | undefined = undefined
	// export let route: string
	export let token1: string | undefined = undefined
	export let token2: string | undefined = undefined

	export let onClick: (() => unknown) | undefined = undefined
</script>

<div class="root grow">
	<div class="row">
		<div class="img">
			<img src={image} alt="waku object" />
		</div>
		<div class="column grow">
			<div class="row">
				{#if $$slots.menu}
					<div class="menu">
						<slot name="menu" />
					</div>
				{/if}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<h2 on:click={onClick}>{title}</h2>
				<slot />
			</div>
			{#if description}
				<span class="description">{description}</span>
			{/if}
			{#if token1}
				<span class="description">{token1}</span>
			{/if}
			{#if token2}
				<span class="description">{token2}</span>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
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
		position: relative;
	}
	.column {
		display: flex;
		flex-direction: column;
	}
	.grow {
		flex-grow: 1;
	}

	.menu {
		position: absolute;
		inset: 0 0 auto auto;
	}

	h2 {
		cursor: pointer;
	}
</style>
