<script lang="ts">
	export let bubble = false
	export let myMessage = false
	export let object = false
	export let group = false
	export let author: undefined | string = undefined

	const isFF = () => {
		let browserInfo = navigator.userAgent
		return browserInfo.includes('Firefox')
	}
</script>

<div
	class={`message ${myMessage ? 'my-message' : 'their-message'} ${isFF() ? 'ff' : ''} ${
		object ? 'object' : ''
	} ${group ? 'group' : ''}`}
>
	<div class={` ${bubble ? 'bubble message-content message-text text-lg' : ''}`}>
		<slot />
		{#if author}
			<div class="author">
				{author}
			</div>
		{/if}
	</div>
	{#if $$slots.avatar}
		<div class="avatar">
			<slot name="avatar" />
		</div>
	{/if}
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

		&.object {
			.message-content {
				width: 100%;
			}
		}
	}

	.message-text {
		padding: var(--spacing-12);
		border-radius: var(--border-radius);
		display: inline-block;
		font-family: var(--font-serif);
		background-color: var(--color-base, var(--color-dark-step-40));
	}

	.my-message {
		font-style: italic;
		margin-left: auto;
		margin-right: 0;

		//The + combinator matches the second element only if it immediately follows the first element.
		& + .my-message:not(.ff) .message-text {
			border-top-right-radius: 0;
		}

		//This combination matches the first element only if it immediately precedes the second element.
		&:has(+ .my-message) {
			margin-bottom: var(--spacing-6);

			.message-text {
				border-bottom-right-radius: 0;
			}
		}
	}

	.their-message {
		align-items: flex-start;
		text-align: left;
		position: relative;

		//The + combinator matches the second element only if it immediately follows the first element.
		& + .their-message:not(.ff) .message-text {
			border-top-left-radius: 0;
		}

		//This combination matches the first element only if it immediately precedes the second element.
		&:has(+ .their-message) {
			margin-bottom: var(--spacing-6);
			.message-text {
				border-bottom-left-radius: 0;
			}
		}

		.message-content {
			text-align: left;
		}

		&.group {
			padding-left: 34px;

			.avatar {
				position: absolute;
				bottom: 0;
				left: 0;

				&:empty {
					display: none;
				}
			}
		}
	}
	.author {
		font-family: sans-serif;
		font-size: var(--font-size-sm);
	}
</style>
