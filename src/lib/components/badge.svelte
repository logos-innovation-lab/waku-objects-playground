<script lang="ts">
	export let dark = false
	export let position: 'top left' | 'top right' | 'bottom left' | 'bottom right' = 'bottom right'
</script>

<span class={`badge text-sm ${dark ? 'dark' : ''} ${position}`}>
	<slot />
</span>

<style lang="scss">
	.badge {
		background-color: var(--ultra-light);
		border-radius: var(--border-radius);
		color: var(--dark);
		padding: var(--spacing-3) var(--spacing-6);
		text-transform: uppercase;
		min-width: 22px;
		text-align: center;

		&.dark {
			background-color: var(--ultra-dark);
			color: var(--white);
			font-weight: var(--font-weight-700);
		}

		&.overlay {
			background-color: rgba(var(--black-rgb), 0.25);
			position: absolute;
		}

		&.top {
			top: var(--spacing-6);
			bottom: auto;
		}

		&.bottom {
			bottom: var(--spacing-6);
			top: auto;
		}

		&.left {
			left: var(--spacing-6);
			right: auto;
		}

		&.right {
			right: var(--spacing-6);
			left: auto;
		}
	}
</style>
