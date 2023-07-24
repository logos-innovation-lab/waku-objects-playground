<script lang="ts">
	import Container from '$lib/components/container.svelte'

	export let title = ''
	export let mainContent: 'center' | 'left' | 'right' = 'center'
</script>

<header class={`header-wrapper main-${mainContent} ${title ? 'title' : ''}`}>
	<Container>
		<div class="white" />
		<div class="root">
			<div class="left">
				<slot name="left" />
			</div>
			{#if title}
				<h1 class="text-normal">{title}</h1>
			{:else if $$slots.chat}
				<div class="chat">
					<slot name="chat" />
				</div>
			{/if}
			<div class="right">
				<slot name="right" />
			</div>
		</div>
	</Container>
</header>

<style lang="scss">
	.header-wrapper {
		position: sticky;
		top: 0;
		height: auto;
		background-color: var(--white);
		border-bottom: 1px solid var(--light);
		z-index: 100;

		.white {
			position: absolute;
			content: '';
			background-color: var(--white);
			top: 0;
			left: 0;
			right: 0;
			height: 64px;
			z-index: 20;
		}

		.root {
			position: relative;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			gap: var(--spacing-12);
			background-color: var(--white);
			z-index: 30;

			h1,
			.chat {
				flex-grow: 1;
				text-align: center;
				font-weight: var(--font-weight-500);
			}

			.chat {
				display: flex;
				gap: var(--spacing-12);
				justify-content: center;
				align-items: center;

				:global(img) {
					border-radius: var(--border-radius);
				}
			}
		}

		.left,
		.right {
			display: flex;
			align-items: center;
			gap: var(--spacing-12);
			flex-direction: row;
		}

		.right {
			justify-content: flex-end;
		}

		.left {
			justify-content: flex-start;
		}

		&.main-center {
			.left,
			.right {
				flex-basis: 42px;
			}
		}

		&.main-left {
			.left {
				flex-grow: 1;
			}
		}

		&.main-right {
			.right {
				flex-grow: 1;
			}
		}
	}
</style>
