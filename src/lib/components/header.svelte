<script lang="ts">
	import Container from '$lib/components/container.svelte'
	import Input from '$lib/components/input.svelte'
	import Search from '$lib/components/icons/search.svelte'
	import Button from '$lib/components/button.svelte'

	export let title = ''
	export let search = false
</script>

<header class={`header-wrapper ${search ? 'search' : ''}`}>
	<Container>
		<div class="root">
			<div class="left">
				<slot name="left" />
				{#if search}
					<div class="search">
						<Button variant="icon">
							<Search size={24} />
						</Button>
					</div>
				{/if}
			</div>
			<h1>{title}</h1>
			<div class="right">
				<slot name="right" />
			</div>
			{#if search}
				<div class="search input">
					<Input />
				</div>
			{/if}
		</div>
	</Container>
</header>

<style lang="scss">
	.header-wrapper {
		position: sticky;
		top: 0;
		height: auto;
		background-color: var(--white);
		z-index: 100;
	}

	.root {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-block: var(--spacing-24);
		gap: var(--spacing-12);

		h1 {
			flex-grow: 1;
			text-align: center;
		}

		.left,
		.right {
			flex-basis: 42px;
		}

		.right {
			display: inline-flex;
			justify-content: flex-end;
		}

		.left {
			display: flex;
			gap: var(--spacing-12);
			flex-direction: row;
			justify-content: flex-start;
			align-items: center;
		}
	}

	:not(.search) {
		.input {
			position: absolute;
			inset: 100% 0 auto;
			padding-block: var(--spacing-12);
		}
	}
</style>
