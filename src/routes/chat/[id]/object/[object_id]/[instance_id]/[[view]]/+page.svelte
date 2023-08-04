<script lang="ts">
	import { page } from '$app/stores'
	import ObjectUI from '$lib/objects/ui.svelte'
	import { goto } from '$app/navigation'
	import routes from '$lib/routes'

	const genRanHex = (size: number) =>
		[...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

	const objectId = $page.params.object_id
	const instanceId = $page.params.instance_id === 'new' ? genRanHex(12) : $page.params.instance_id
	const chatId = $page.params.id
	let view = $page.params.view

	function onViewChange(view: string) {
		goto(routes.OBJECT(chatId, objectId, view))
	}
</script>

<ObjectUI {objectId} {chatId} {instanceId} {onViewChange} {view} />
