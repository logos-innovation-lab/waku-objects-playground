<script lang="ts">
	import { Information } from 'carbon-icons-svelte'

	export let name: string | undefined = undefined
	export let logoImg: string | undefined = undefined
	export let logoAlt: string | undefined = undefined
	export let onClick: (() => void) | undefined = undefined
</script>

<div class="wo-header" on:click={onClick} on:keypress={onClick} role="button" tabindex="0">
	{#if logoImg}
		<img src={logoImg} alt={logoAlt} />
	{/if}
	{#if name}
		<p class="text-normal grow">{name}</p>
	{/if}
	<div class="info">
		<Information />
	</div>
	<slot />
</div>

<style lang="scss">
	.wo-header {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: center;
		font-weight: 500;
		margin-left: 0;
		margin-right: 0;
		margin-top: calc(-1 * var(--spacing-12));
		border-color: var(--color-step-20, var(--color-step-40));
		border-width: 1px;
		border-style: solid;
		border-radius: var(--spacing-24);
		cursor: pointer;

		img {
			width: 36px;
			height: 36px;
			aspect-ratio: 1;
			border-radius: var(--spacing-12);
			margin: var(--spacing-6);
		}
		.grow {
			flex-grow: 1;
		}

		.info {
			justify-self: flex-end;
			padding-right: var(--spacing-12);
		}
	}
</style>
