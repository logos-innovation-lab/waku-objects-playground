<script lang="ts">
	export let title: string
</script>

<div class="label">
	<span class="text-sm">{title}</span>
	<div class="input-wrapper">
		<!-- svelte-ignore a11y-autofocus -->
		<div class="text-lg input">
			<slot />
		</div>
	</div>
</div>

<style>
	.label {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.label span {
		margin-inline: 13px;
		text-align: left;
		color: var(--color-step-40, var(--color-dark-step-20));
	}

	.input-wrapper {
		position: relative;
	}

	.input {
		border: 1px solid var(--color-step-20, var(--color-dark-step-40));
		border-radius: var(--border-radius);
		padding: 11px var(--spacing-12);
		max-height: 120px;
		min-height: 48px;
		width: 100%;
		color: var(--color-step-40, var(--color-dark-step-20));
		background-color: var(--color-base, var(--color-dark-accent));
	}
</style>
