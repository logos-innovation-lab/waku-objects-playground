<!-- <script lang="ts">
	export let value: string
	export let bindGroup: string[]

	function onChange(event: Event & { target: HTMLInputElement }) {
		const { value, checked } = target
		if (checked) {
			bindGroup = [...bindGroup, value]
		} else {
			bindGroup = bindGroup.filter((item) => item !== value)
		}
	}
</script>

<input type="checkbox" {value} checked={bindGroup.includes(value)} on:change={onChange} />

<style lang="scss">
	// input[type='checkbox'] {
	// 	&:before {
	// 		content: '';
	// 		display: inline-block;
	// 		width: 16px;
	// 		height: 16px;
	// 		margin-right: 10px;
	// 		position: absolute;
	// 		left: 0;
	// 		bottom: 1px;
	// 		background-color: pink;
	// 		box-shadow: inset 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 1px 0px 0px rgba(255, 255, 255, 0.8);
	// 	}
	// }
</style> -->
