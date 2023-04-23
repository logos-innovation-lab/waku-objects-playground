<script lang="ts">
	import Wallet from '$lib/components/icons/wallet.svelte'
	import ArrowLeft from '$lib/components/icons/arrow-left.svelte'

	import Container from '$lib/components/container.svelte'
	import Header from '$lib/components/header.svelte'
	import Button from '$lib/components/button.svelte'

	import { profile } from '$lib/stores/profile'
	import adapters from '$lib/adapters'
	import { goto } from '$app/navigation'
</script>

<Container gap={12}>
	<Header>
		<Button
			slot="left"
			icon={ArrowLeft}
			border={false}
			variant="nopad"
			on:click={() => goto('/')}
		/>
		<h1>Profile</h1>
	</Header>

	<div class="mid">
		{#if $profile.address}
			<h2>Your account</h2>
			<pre>{$profile.address}</pre>
		{:else}
			<h2>Connect your wallet</h2>
			<p>To use Waku Objects, you need to access your account by connecting your wallet.</p>
			<Button disabled={!adapters.canLogIn()} on:click={adapters.logIn}><Wallet /></Button>
		{/if}
	</div>
</Container>

<style lang="scss">
	.mid {
		flex-grow: 1;
	}
</style>
