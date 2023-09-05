<script lang="ts">
	import { page } from '$app/stores'
	import ObjectUI from '$lib/objects/ui.svelte'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'
	import AuthenticatedOnly from '$lib/components/authenticated-only.svelte'
	import { genRandomHex } from '$lib/utils'

	const objectId = $page.params.object_id
	const instanceId =
		$page.params.instance_id === 'new' ? genRandomHex(12) : $page.params.instance_id
	const chatId = $page.params.id
	$: view = $page.params.view
	$: params = $page.params.rest.split('/') ?? []

	function onViewChange(view: string, ...rest: string[]) {
		goto(routes.OBJECT(chatId, objectId, instanceId, `${[view, ...rest].join('/')}`))
	}
</script>

<AuthenticatedOnly let:wallet>
	<ObjectUI {objectId} {chatId} {instanceId} {onViewChange} {view} {wallet} {params} />
</AuthenticatedOnly>
