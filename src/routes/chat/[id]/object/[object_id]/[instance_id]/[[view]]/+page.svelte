<script lang="ts">
	import { page } from '$app/stores'
	import ObjectUI from '$lib/objects/ui.svelte'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'

	const instanceId = $page.params.instance_id
	const objectId = $page.params.object_id
	const chatId = $page.params.id

	function onViewChange(view: string) {
		goto(routes.OBJECT_NEW(chatId, 'new', view))
	}
</script>

<ObjectUI {objectId} {chatId} {instanceId} {onViewChange} />
