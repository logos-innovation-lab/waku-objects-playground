<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Container from '$lib/components/container.svelte'
	import Divider from '$lib/components/divider.svelte'
	import adapter, { adapterName, adapters, type AdapterName } from '$lib/adapters'
	import Dropdown from '$lib/components/dropdown.svelte'
	import DropdownItem from '$lib/components/dropdown-item.svelte'
	import Select from '$lib/components/select.svelte'
	import Asset from '$lib/components/asset.svelte'
	import { saveToLocalStorage } from '$lib/utils/localstorage'
	import { walletStore } from '$lib/stores/wallet'
	import Button from '$lib/components/button.svelte'
	import { balanceStore } from '$lib/stores/balances'
	import type FirebaseAdapter from '$lib/adapters/firebase'

	function changeAdapter(adapterName: AdapterName) {
		saveToLocalStorage('adapter', adapterName)
		location.reload()
	}

	function initializeBalances() {
		const wallet = $walletStore.wallet

		if (!wallet) return
		;(adapter as unknown as FirebaseAdapter).initializeBalances(wallet)
	}
</script>

<Header title="DEV DASHBOARD" />
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
	{#if adapterName === 'firebase'}
		<section>
			<Button disabled={!$walletStore.wallet} on:click={initializeBalances}
				>Initialize token balances</Button
			>
			{#each $balanceStore.balances as balance}
				<Asset
					name={balance.name}
					token={balance.symbol}
					amount={balance.amount}
					decimals={balance.decimals}
					image={balance.image}
				/>
			{/each}
		</section>
	{/if}
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
