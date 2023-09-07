<script lang="ts">
	import ChatMessage from '$lib/components/chat-message.svelte'
	import type { DataMessage } from '$lib/stores/chat'
	import type { WakuObjectArgs } from '..'

	// Template
	import template from './template.html?raw'

	// Types
	import { getNPMObject, type LoadedObject } from './lib'
	import { makeIframeDispatcher, type IframeContextChange } from './dispatch'
	import { postWindowMessage, registerWindow, unregisterWindow } from '.'
	import { onDestroy } from 'svelte'
	import adapters from '$lib/adapters'
	import { walletStore } from '$lib/stores/wallet'

	// TODO: This needs escaping for the CSP
	const getIframeSource = (object: LoadedObject): string => {
		return template.replace('__CSP__', object.csp).replace('__URL__', object.script)
	}

	// Exports
	export let message: DataMessage | undefined
	export let args: WakuObjectArgs

	// Local variables
	let object: LoadedObject | null
	let iframe: HTMLIFrameElement
	let lastContextHash: number | undefined = undefined

	$: wallet = $walletStore.wallet

	let started = false
	$: if (wallet && !started) {
		const adapterWallet = wallet
		const iframeDispatcher = makeIframeDispatcher(args, adapters)
		window.addEventListener(
			'message',
			(event) => {
				// Necessary to know from which frame this originated
				if (event.origin === 'null' && event.source && event.source === iframe?.contentWindow) {
					const { data } = event
					if (typeof data === 'object') {
						console.debug(data.type, { data })
						switch (data.type) {
							case 'window-size': {
								const { scrollWidth, scrollHeight } = data
								// iframe.style.width = `${scrollWidth}px`
								iframe.style.height = `${scrollHeight}px`
								return
							}
							case 'init': {
								updateContext(true)
								return
							}
							default: {
								const window = iframe.contentWindow
								iframeDispatcher.onMessage(data, args, window, adapterWallet)
								return
							}
						}
					}
				}
			},
			false,
		)
		started = true
	}

	$: args && getNPMObject(args.objectId).then((result) => (object = result))
	$: if (iframe && iframe.contentWindow) {
		registerWindow(args.instanceId, iframe.contentWindow)
		updateContext()
	}
	onDestroy(() => unregisterWindow(args.instanceId))

	function updateContext(force = false) {
		const { chatId, objectId, instanceId, profile, users, tokens, view, store } = args
		const iframeContextChange: IframeContextChange = {
			type: 'iframe-context-change',
			state: {
				chatId,
				objectId,
				instanceId,
				profile,
				users,
				tokens,
			},
			context: {
				view,
				store,
			},
		}
		const json = JSON.stringify(iframeContextChange, (key, value) =>
			typeof value === 'bigint' ? value.toString(10) : value,
		)
		const contextHash = Array.from(json).reduce(
			(hash, char) => 0 | (31 * hash + char.charCodeAt(0)),
			0,
		)

		console.debug({ contextHash, lastContextHash, iframe, iframeContextChange })

		if (force || lastContextHash !== contextHash) {
			postWindowMessage(args.instanceId, iframeContextChange)
			lastContextHash = contextHash
		}
	}
</script>

{#if object}
	<ChatMessage myMessage={args?.profile.address === message?.fromAddress} bubble noText>
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
		/* overflow: hidden; */
	}
</style>
