<script lang="ts">
	export let value: string
	export let bindGroup: string[]

	function onChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		const { value, checked } = event.currentTarget
		if (checked) {
			bindGroup = [...bindGroup, value]
		} else {
			bindGroup = bindGroup.filter((item) => item !== value)
		}
	}
</script>

<input type="checkbox" {value} checked={bindGroup.includes(value)} on:change={onChange} />

<style lang="scss">
	input[type='checkbox'] {
		position: relative;
		&::before {
			content: '';
			display: inline-block;
			width: 18px;
			height: 18px;
			position: absolute;
			right: 0;
			top: 50%;
			transform: translateY(-50%);
			background-color: var(--color-base, var(--color-dark-accent));
			border: var(--border);
			border-color: var(--color-accent, var(--color-dark-base));
		}
		&:checked::before {
			background-color: var(--color-accent, var(--color-dark-base));
		}
		&:checked::after {
			content: '';
			position: absolute;
			top: 50%;
			bottom: 50%;
			transform: translate(-85%, -65%) rotate(45deg);
			height: 10px;
			width: 6px;
			margin-left: 50%;
			border-bottom: 2px solid var(--color-base, var(--color-dark-accent));
			border-right: 2px solid var(--color-base, var(--color-dark-accent));
		}
	}
</style>
