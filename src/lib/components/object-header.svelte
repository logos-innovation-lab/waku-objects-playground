<script lang="ts">
	export let name: string | undefined = undefined
	export let logoImg: string | undefined = undefined
	export let logoAlt: string | undefined = undefined
</script>

<div class="wo-header">
	{#if logoImg}
		<img src={logoImg} alt={logoAlt} />
	{/if}
	{#if name}
		<p class="text-normal grow">{name}</p>
	{/if}
	<slot />
</div>

<style lang="scss">
	.wo-header {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
		font-weight: 500;
		width: calc(100% + var(--spacing-24));
		margin-left: calc(-1 * var(--spacing-12));
		margin-right: calc(-1 * var(--spacing-12));
		margin-top: calc(-1 * var(--spacing-12));

		img {
			width: 48px;
			height: 48px;
			aspect-ratio: 1;
			border-radius: var(--spacing-12);
		}
		.grow {
			flex-grow: 1;
		}
	}
</style>
