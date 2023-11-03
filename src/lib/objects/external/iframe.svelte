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
	import { exchangeStore } from '$lib/stores/exchangeRates'
	import { preferences } from '$lib/stores/preferences'
	import { defaultBlockchainNetwork } from '$lib/adapters/transaction'

	// TODO: This needs escaping for the CSP
	const getIframeSource = (object: LoadedObject): string => {
		return template
			.replace('__CSP__', object.csp)
			.replace('__URL__', object.script)
			.replace('__CLASS__', object.className)
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
						switch (data.type) {
							case 'window-size': {
								const { scrollWidth, scrollHeight } = data
								if (isStandalone()) {
									iframe.style.width = `${scrollWidth}px`
								}
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

	$: args &&
		getNPMObject(args.objectId, message ? 'chat' : 'standalone').then((result) => (object = result))
	$: if (iframe && iframe.contentWindow) {
		registerWindow(args.instanceId, iframe.contentWindow)
		updateContext()
	}
	onDestroy(() => unregisterWindow(args.instanceId))

	function isStandalone() {
		return !message
	}

	function updateContext(force = false) {
		const {
			chatId,
			chatName,
			chatType,
			objectId,
			instanceId,
			profile,
			users,
			tokens,
			view,
			viewParams,
			store,
		} = args
		const iframeContextChange: IframeContextChange = {
			type: 'iframe-context-change',
			state: {
				chainId: defaultBlockchainNetwork.chainId,
				chatId,
				chatName,
				chatType,
				objectId,
				instanceId,
				profile,
				users,
				tokens,
				exchangeRates: $exchangeStore.exchange,
				fiatSymbol: $preferences.fiatSymbol,
			},
			context: {
				view,
				viewParams,
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

		if (force || lastContextHash !== contextHash) {
			postWindowMessage(args.instanceId, iframeContextChange)
			lastContextHash = contextHash
		}
	}
</script>

{#if object}
	{#if message}
		<ChatMessage myMessage={args?.profile.publicKey === message?.senderPublicKey} bubble noText>
			<iframe
				title={object.name}
				bind:this={iframe}
				sandbox="allow-scripts"
				srcdoc={getIframeSource(object)}
			/>
		</ChatMessage>
	{:else}
		<iframe
			title={object.name}
			bind:this={iframe}
			sandbox="allow-scripts"
			srcdoc={getIframeSource(object)}
		/>
	{/if}
{/if}

<style>
	iframe {
		all: unset;
		/* overflow: hidden; */
	}
</style>
