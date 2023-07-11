import type { WakuObjectDescriptor } from '..'
import HelloWorld from './hello-world.svelte'
import logo from './logo.svg'

export interface HelloWorldStore {
	name?: string
}

export const HELLO_WORLD_OBJECT_ID = 'hello-world'

export const helloWorldDescriptor: WakuObjectDescriptor = {
	objectId: HELLO_WORLD_OBJECT_ID,
	name: 'Hello World',
	description: 'Say hello',
	logo,

	wakuObject: HelloWorld,

	onMessage: (address, store, message) => {
		return message.data
	},
}
