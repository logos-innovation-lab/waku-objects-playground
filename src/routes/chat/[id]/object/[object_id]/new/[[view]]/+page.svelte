<script lang="ts">
	import { page } from '$app/stores'
	import ObjectUI from '$lib/objects/ui.svelte'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'

	const genRanHex = (size: number) =>
		[...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

	const instanceId = genRanHex(12)
	const objectId = $page.params.object_id
	const chatId = $page.params.id

	function onViewChange(view: string) {
		goto(routes.OBJECT_NEW(chatId, objectId, view))
	}
</script>

<ObjectUI {objectId} {chatId} {instanceId} {onViewChange} />
