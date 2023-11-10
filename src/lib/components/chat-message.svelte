<script lang="ts">
	//draws the message bubble
	export let bubble = false

	//am I the sender of this message?
	export let myMessage = false

	//did this message come from an object?
	export let object = false
	export let noText = false

	//is this message in a group chat?
	export let group = false

	//is the sender of the current message the same as the previous message?
	export let sameSender = false

	//name of the person who sent the message
	export let senderName: undefined | string = undefined

	export let timestamp: string | undefined = undefined

	export let onClick: (() => void) | undefined = undefined

	const isFF = () => {
		let browserInfo = navigator.userAgent
		return browserInfo.includes('Firefox')
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	on:click={() => (onClick ? onClick() : {})}
	class={`message ${myMessage ? 'my-message' : 'their-message'} ${isFF() ? 'ff' : ''} ${
		object ? 'object' : ''
	} ${group ? 'group' : ''} ${sameSender ? 'same' : ''} ${noText ? 'no-text' : ''}`}
>
	<div class={`${bubble ? 'bubble message-content message-text text-lg' : ''}`}>
		<slot />
		{#if senderName}
			<div class="bottom">
				<div class="author">
					{senderName}
				</div>
				{#if timestamp}
					<div class="timestamp">
						{timestamp}
					</div>
				{/if}
			</div>
		{/if}
		{#if myMessage || !senderName}
			{#if timestamp}
				<div class="timestamp">
					{timestamp}
				</div>
			{/if}
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
		flex-direction: row;
		justify-content: end;

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

		.timestamp {
			text-align: end;
		}
	}

	.their-message {
		align-items: flex-start;
		text-align: left;
		position: relative;

		//The + combinator matches the second element only if it immediately follows the first element.
		& + .their-message.same:not(.ff) .message-text {
			border-top-left-radius: 0;
		}

		//This combination matches the first element only if it immediately precedes the second element.
		&:has(+ .their-message.same) {
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

		.timestamp {
			text-align: end;
		}
	}
	.author {
		font-family: sans-serif;
		font-size: var(--font-size-sm);
	}

	.no-text .text-lg {
		line-height: 0;
	}

	.bottom {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		flex-grow: 1;

		.timestamp {
			margin-left: var(--spacing-12);
		}
	}

	.timestamp {
		font-size: var(--font-size-sm);
		color: var(--color-step-40);
		font-style: normal;
		font-family: sans-serif;
	}
</style>
