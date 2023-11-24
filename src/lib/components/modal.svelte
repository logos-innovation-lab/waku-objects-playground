<script lang="ts">
	export let title: string
	export let message: string
</script>

<div class="root">
	<div class="wrapper">
		<h1>{title}</h1>
		<p class="text-lg">{message}</p>
		<div class="actions">
			<slot />
		</div>
	</div>
</div>

<style>
	.root {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: grid;
		place-items: center;
		background-color: rgba(var(--color-base-rgb, var(--color-dark-accent-rgb)), 0.5);
		z-index: 1000;
		padding: var(--spacing-24);
	}
	.wrapper {
		background-color: var(--color-base, var(--color-dark-accent));
		border-radius: var(--spacing-12);
		padding: var(--spacing-24);
		display: grid;
		gap: var(--spacing-12);
		place-items: center;
		text-align: center;
		box-shadow: 0px 1px 5px rgba(var(--color-accent-rgb, var(--color-dark-base-rgb)), 0.25);
	}
	.actions {
		padding-top: var(--spacing-12);
		gap: var(--spacing-12);
	}
</style>
