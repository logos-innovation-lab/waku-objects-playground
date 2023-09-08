<script lang="ts">
	import { getPicture } from '$lib/adapters/ipfs'

	export let picture: string
	export let size = 128
</script>

<div class="img" style={`width: ${size}px; height: ${size}px;`}>
	<img src={getPicture(picture)} alt="profile" />
	<div class="button"><slot /></div>
</div>

<style>
	.img {
		aspect-ratio: 1;
		position: relative;
	}

	img {
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 12px;
	}
	.button {
		position: absolute;
		right: 0;
		top: 0;
	}
</style>
