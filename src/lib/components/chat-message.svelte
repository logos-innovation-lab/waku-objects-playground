<script lang="ts">
	export let bubble = false
	export let myMessage = false
</script>

<div class={`message ${myMessage ? 'my-message' : 'their-message'}`}>
	<div class={` ${bubble ? 'bubble message-content message-text text-lg' : ''}`}>
		<slot />
	</div>
</div>

<style lang="scss">
	.message {
		display: flex;
		gap: var(--spacing-6);
		flex-direction: column;
		align-items: flex-end;
		max-width: 75%;
		margin-right: auto;
		margin-left: 0;
		&:not(:last-child) {
			margin-bottom: var(--spacing-12);
		}
	}

	.message-content {
		text-align: right;
	}

	.message-text {
		padding: var(--spacing-12);
		border-radius: var(--border-radius);
		display: inline-block;
		font-family: var(--font-serif);
		background-color: var(--white);
	}

	.my-message {
		font-style: italic;
		margin-left: auto;
		margin-right: 0;
	}

	.their-message {
		align-items: flex-start;
		text-align: left;

		.message-content {
			text-align: left;
		}
	}
</style>
