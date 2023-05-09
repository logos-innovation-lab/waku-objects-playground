<script lang="ts">
	export let image: string | undefined = undefined
	export let title: string | undefined = undefined
	export let description: string | undefined = undefined
	export let token1: string | undefined = undefined
	export let token2: string | undefined = undefined

	export let onClick: (() => unknown) | undefined = undefined
</script>

<div class="card">
	<div class="row">
		{#if image}
			<div class="img">
				<img src={image} alt="waku object" />
			</div>
		{/if}
		<div class="column grow">
			<div class="row">
				{#if $$slots.menu}
					<div class="menu">
						<slot name="menu" />
					</div>
				{/if}
				{#if onClick}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<h3 on:click={onClick}>{title}</h3>
				{:else}
					<h3>{title}</h3>
				{/if}
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
	.card {
		border: 1px solid var(--gray20);
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
	// .grow {
	// 	flex-grow: 1;
	// }

	.menu {
		position: absolute;
		inset: 0 0 auto auto;
	}

	h3 {
		cursor: pointer;
	}
</style>
