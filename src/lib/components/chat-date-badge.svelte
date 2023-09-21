<script lang="ts">
	export let text: string
</script>

<div class="time-separator">{text}</div>

<style lang="scss">
	.time-separator {
		background-color: var(--color-step-20, var(--color-dark-step-40));
		color: var(--color-step-50, var(--color-dark-step-20));
		font-size: var(--font-size-sm);
		border-radius: var(--border-radius);
		text-align: center;
		margin-left: auto;
		margin-right: auto;
		margin-top: var(--spacing-24);
		margin-bottom: var(--spacing-24);
		max-width: fit-content;
		padding-left: var(--spacing-6);
		padding-right: var(--spacing-6);
		padding-top: var(--spacing-3);
		padding-bottom: var(--spacing-3);
	}
</style>
