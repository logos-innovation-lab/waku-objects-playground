<script lang="ts">
	import type { DataMessage } from '$lib/stores/chat'
	import type { WakuObjectArgs } from '..'
	import IframeComponent from './iframe.svelte'

	// Exports
	export let message: DataMessage
	export let args: WakuObjectArgs
</script>

<IframeComponent {message} {args} />
