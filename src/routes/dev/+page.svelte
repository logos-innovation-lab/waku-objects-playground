<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import Divider from '$lib/components/divider.svelte'
	import { adapterName, adapters, type AdapterName } from '$lib/adapters'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Select from '$lib/components/select.svelte'
    import { saveToLocalStorage } from '$lib/utils/localstorage'
	
	function changeAdapter(adapterName: AdapterName) {
		saveToLocalStorage('adapter', adapterName)
		location.reload()
	}
</script>

<Header title="DEV DASHBOARD"/>
<Container>
	<section>
		<Dropdown>
            <Select slot="button" label="Adapter" value={adapterName} />

			{#each adapters as adapter}
				<DropdownItem active={adapterName === adapter} onClick={() => changeAdapter(adapter)}
					>{adapter}</DropdownItem
				>
			{/each}
		</Dropdown>
	</section>
	<Divider />
</Container>

<style lang="scss">
	section {
		margin-top: 1rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>