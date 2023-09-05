import type { WakuObjectSvelteDescriptor } from '..'
import HelloWorld from './hello-world.svelte'
import logo from './logo.svg'

export type HelloWorldStore = {
	name: string
}

export const HELLO_WORLD_OBJECT_ID = 'hello-world'

export const helloWorldDescriptor: WakuObjectSvelteDescriptor = {
	objectId: HELLO_WORLD_OBJECT_ID,
	name: 'Hello World',
	description: 'Say hello',
	logo,

	wakuObject: HelloWorld,

	onMessage: async (message, args) => {
		args.updateStore(() => message.data)
	},
}
