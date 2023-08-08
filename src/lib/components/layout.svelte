<script lang="ts">
	export let align: 'top' | 'center' = 'top'
	export let bgColor: 'base' | 'shade' = 'base'
</script>

<div class={`wrapper ${bgColor}`}>
	<slot name="header" />
	<div class={`grow ${align}`}>
		<slot />
	</div>
	<slot name="footer" />
</div>

<style lang="scss">
	.wrapper {
		display: flex;
		flex-direction: column;
		position: relative;
		height: 100vh;
		height: 100dvh;
	}

	.base {
		background-color: var(--color-base, var(--color-dark-accent));
	}

	.shade {
		background-color: var(--color-step-10, var(--color-dark-step-50));
	}

	.grow {
		flex-grow: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.top {
		justify-content: flex-start;
	}

	.center {
		justify-content: center;
	}
</style>
