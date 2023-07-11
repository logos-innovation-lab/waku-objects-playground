<script lang="ts">
	import ChatMessage from '$lib/components/chat-message.svelte'
	import type { DataMessage } from '$lib/stores/chat'
	import type { WakuObjectArgs } from '..'

	// Template
	import template from './template.html?raw'

	// Types
	import { getNPMObject, type LoadedObject } from './lib'

	// TODO: This needs escaping for the CSP
	const getIframeSource = (object: LoadedObject): string => {
		return template
			.replace('__CSP__', object.csp)
			.replace('__URL__', object.script)
			.replace('__EMBED__', object.embed.message)
	}

	// Exports
	export let customArgs: { name: string }
	const { name } = customArgs

	// Local variables
	let object: LoadedObject | null
	let iframe: HTMLIFrameElement

	window.addEventListener(
		'message',
		(event) => {
			// Necessary to know from which frame this originated
			if (event.origin === 'null' && event.source === iframe.contentWindow) {
				const { data } = event
				if (typeof data === 'object') {
					switch (data.type) {
						case 'window-size':
							const { scrollWidth, scrollHeight } = data
							iframe.style.width = `${scrollWidth}px`
							iframe.style.height = `${scrollHeight}px`
					}
				}
			}
		},
		false,
	)

	export let message: DataMessage
	export let args: WakuObjectArgs

	// TODO: Add option to add external objects
	$: name && getNPMObject(name, message).then((result) => (object = result))
</script>

{#if object}
	<ChatMessage myMessage={args.profile.address === message?.fromAddress} bubble noText>
		<iframe
			title={object.name}
			bind:this={iframe}
			sandbox="allow-scripts"
			srcdoc={getIframeSource(object)}
		/>
	</ChatMessage>
{/if}

<style>
	iframe {
		all: unset;
		overflow: hidden;
	}
</style>
