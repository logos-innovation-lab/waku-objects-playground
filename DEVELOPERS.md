# Waku Objects Developers Documentation

## Table of Contents

- [Overview](#overview)
  - [Terminology](#terminology)
- [Waku Objects Chat Protocol](#waku-objects-chat-protocol)
  - [Message types](#message-types)
    - [UserMessage type](#usermessage-type)
    - [InviteMessage type](#invitemessage-type)
    - [DataMessage type](#datamessage-type)
  - [Private chat](#private-chat)
  - [Group chat](#group-chat)
  - [Other data definitions](#other-data-definitions)
- [Waku Object SDK](#waku-object-sdk)
  - [Overview](#overview-1)
  - [Concepts](#concepts)
  - [Types](#types)
    - [Metadata](#metadata)
    - [onMessage callback](#onmessage-callback)
    - [Args](#args)
    - [Adapter](#adapter)
    - [State](#state)
  - [External objects](#external-objects)
    - [External adapter](#external-adapter)
    - [Sandbox example object](#sandbox-example-object)
    - [Package conventions](#package-conventions)
  - [Create your own Waku Object](#create-your-own-waku-object)
  - [Future directions](#future-directions)
- [Resources](#resources)

## Overview

Waku Objects is an open, modular system for transactional mini-applications to be built inside a chat application. Open, because it uses open standards for interoperability and provides a default [web based implementation](https://www.wakuplay.im/). Modular, because it may be implemented in any chat application that supports structured data messages that are sent alongside user messages. Transactional, because it supports blockchain transactions and smart contract interactions on Ethereum compatible blockchains.

The Waku Object concept enables building social applications, where the social context is provided by the chat (private 1on1 or group at the moment) so that there is already some implied trust between the participants. The Waku Object SDK provides an interface for objects to communicate easily with the other participants' objects and is designed to share the least information possible in a sandboxed environment with the goal of minimising the possibility of leaking private or personal data.

The current implementation uses the [Waku protocol](https://waku.org/) as transport and storage layer. The objects' code may be run in a sandboxed iframe protected by [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). The communication between the application and the objects are done with JSON serializable data. Native applications may use web views provided by their appropriate platforms to display and communicate with the Waku Objects.

There are also extensive [design guidelines](https://www.wakuplay.im/design) for developers who want to create their own Waku Objects. It is recommended to start reading there to get the big picture about the concept and come back here after.

### Terminology

- Waku Object: the mini-application that may have chat widgets and a full screen view (standalone view)
- Waku Chat: the default chat host application
- Waku Play: the proof-of-concept implementation of Waku Objects that contains a default chat app and some example Waku Objects
- Chat widget: the view of the Waku Object displayed inline the chat
- Standalone view: the view of the Waku Object that can be used for forms and more detailed information
- Host application: the application (typically a chat app) which embeds the Waku Object and implements the protocol and SDK

## Waku Objects Chat Protocol

The current implementation of the chat protocol is considered as a proof-of-concept and it was designed for simplicity and to help iterating quickly. Because of this at the moment the protocol is not encrypted and anyone can impersonate anyone, since there are no built-in security to protect against this.

However on the higher level application layer everything was designed in a way so that the chat protocol implementation can replaced by a reasonably secure version (the Signal protocol was used as an assumption) and everything could still work without the need for inventing currently non-existing cryptographic protocols.

### Message types

The communication uses serialized JSON objects. The users are represented by their Ethereum addresses which is derived from a private key they provide in the form of a mnemonic. There are three message types defined:

```typescript
export type Message = UserMessage | InviteMessage | DataMessage
```

#### UserMessage type

The `UserMessage` type is used for transmitting chat messages between the participants. The definitions is as follows:

```typescript
export interface UserMessage {
	type: 'user'
	timestamp: number
	fromAddress: string
	text: string
}
```

There is a field `type` that is `user`, the `timestamp` is the number of milliseconds since the Unix Epoch in UTC. The `fromAddress` is the ethereum address of the sender as a string, prefixed with `0x`. The `text` field contains the text of the message.

#### InviteMessage type

The `InviteMessage` type is currently used to invite people to group chats.

```typescript
export interface InviteMessage {
	type: 'invite'
	timestamp: number
	fromAddress: string
	chatId: string
}
```

There is a field `type` that is `invite`, the `timestamp` is the number of milliseconds since the Unix Epoch in UTC. The `fromAddress` is the ethereum address of the sender as a string, prefixed with `0x`. The `chatId` field contains the id of the group encoded as string. See the [Group chats](#group-chat) for more information.

#### DataMessage type

The `DataMessage` type is used for Waku Object instances to communicate with each other. They can cause state changes in existing objects or create new chat widgets that may be visible for the user.

```typescript
export interface DataMessage<T extends JSONSerializable = JSONSerializable> {
	type: 'data'
	timestamp: number
	fromAddress: string
	objectId: string
	instanceId: string
	data: T
}
```

There is a field `type` that is `invite`, the `timestamp` is the number of milliseconds since the Unix Epoch in UTC. The `fromAddress` is the ethereum address of the sender as a string, prefixed with `0x`. The `objectId` is the unique id of the Waku Object, for external objects it is the same as their `npm` package name. Each object may have multiple instances. The `instanceId` is a unique identifier, in the current implementation it is a 12-characters long random hexstring. The `data` field contains the object specific data, the only requirement for it is it have to be JSON serializable, so there can be no circular references in it.

### Private chat

The private chat is defined as a private conversation between two participants. Each user has a pubsub topic derived from their Ethereum address, where others can send messages. The topic is defined as follows:

`/${topicApp}/${topicVersion}/${contentTopic}/${id}`

Where `topicApp` is `wakuobjects-playground`, `topicVersion` is `1`, `contentTopic` is `private-message` and `id` is the Ethereum address of the user.

In the current implementation the users can send messages to each other just by knowing their addresses. In the application there is a screen shown when someone new wants to talk to you.

There is an invite mechanism that generates a link with your address for sharing. From that a QR code can also be generated.

### Group chat

The group chat is defined as a group conversation between any number of participants, where you know at least one participant. They can send you an [Invite message](#invitemessage-type) as a private chat message where the `chatId` is the unique identifier of the group. The group id is a 64-characters long random hex string.

Each group has their own specific topic that group members need to subscribe to. The topic is defined as follows:

`/${topicApp}/${topicVersion}/${contentTopic}/${id}`

Where `topicApp` is `wakuobjects-playground`, `topicVersion` is `1`, `contentTopic` is `private-message` and `id` is the group chat id. Participants can send messages to this topic and then others in the same group will receive it. Currently only user and data messages are considered as legal group chat messages.

There is no concept of access control in the group protocol, any existing member can invite new members. Currently a protocol for leaving a group is not implemented, but users may forget the topic of a group if they are no longer interested in following it.

### Other data definitions

The Waku Chat app also uses the Waku network as its storage layer, except for images. Images are currently stored on IPFS but any content-addressed network storage could be used. Currently all data is stored unencrypted. The app stores both internal data and shared data on the network. Internal data is stored as the serialization of internal application states, such as the chat and object stores and these are read back from waku storage when the app starts.

The definitions for these can be found in the [Waku Adapter](https://github.com/logos-innovation-lab/waku-objects-playground/blob/main/src/lib/adapters/waku/index.ts) source code.

There are also shared data stored on the network. For example the profile information for a user is shared under a specific topic so that other users can find it and display it.

```typescript
export interface StorageProfile {
	name: string
	avatar?: string
}
```

The `name` is the display name of the user and the `avatar` optional field contains an IPFS hash of the user's profile picture. The topic of the profile is `/wakuobjects-playground/1/profile/${address}` where `address` is the user's Ethereum address.

Similarly for the group chat there is a type definition:

```typescript
export interface StorageChat {
	users: string[]
	name: string
	avatar?: string
}
```

The `name` is the display name of the chat and the `avatar` optional field contains an IPFS hash of the chat's profile picture. The topic of the group chat is `/wakuobjects-playground/1/group-chats/${chatId}` where `chatId` is the group chat id.

The definitions for these can be found in the [Waku Adapter Types](https://github.com/logos-innovation-lab/waku-objects-playground/blob/main/src/lib/adapters/waku/types.ts) file.

## Waku Object SDK

### Overview

The Waku Object SDK enables developers to write their own Waku Object implementations. It provides interfaces that wraps the chat context and exposes functionality to objects to interact with other instances or with external services (storage, transactions, smart contracts, etc.).

The SDK is designed in a way so that it is natural to use with reactive UI libraries (which represent the mainstream paradigm on the web) but it is also possible to use it with any kind of applications. The Waku Chat host application is written in Svelte, but other frontend libraries can be used to create objects (see [External objects](#external-objects)) and the system is designed in a way that host applications can be written in any language as long as they can embed Waku Objects in a web view provided by the native system.

**Disclaimer**: the Waku Object SDK is currently in an early proof-of-concept state. Most things work, but there are some missing things and rough edges and it is expected that things will move around and break.

### Concepts

Users can create a new instance of a Waku Object by choosing the object from the chat menu, or by receiving a `DataMessage` from one of their contacts who created one. Each Waku Object instance has a random, unique identifier (`instanceId`). By default the instances do not know about each other, however it is possible to use an external resource (e.g. the blockchain) to share the `instanceId`s between instances and therefore make them aware of each other.

Each instance has access to a private persistent store that may be used for storing the internal state. The store is not shared between the instances participating in the chat, but it is unique per user. It is however saved to persistent storage, so it will keep the state after the application is reloaded.

The SDK provides an adapter interface which gives access to external services. Currently only blockchain-related operations are exposed and the goal is hide as much private or personal data from objects in order to minimize data leakage. The adapter can be extended later with other services and host applications may even give users the choice in by approving access by functionality per object.

### Types

The type definitions can be found in [this](https://github.com/logos-innovation-lab/waku-objects-playground/blob/main/src/lib/objects/index.d.ts) file.

#### Metadata

Each Waku Object must have a meta data description:

```typescript
interface WakuObjectMetadata {
	readonly objectId: string
	readonly name: string
	readonly description: string
	readonly logo: string
}
```

The `objectId` is the unique id of the Waku Object, for external objects it is the same as their `npm` package name. The `name` filed contains the displayed name of the object and the `description` is a one-line description of what the object does. The `logo` contains the imported SVG of the logo of the object. The [design guidelines](https://www.wakuplay.im/design) talks more about the best practices about how to fill these fields.

#### onMessage callback

Most object type will need to implement some stateful logic. For that the `WakuObjectMetadata` is extended in the `WakuObjectDescriptor` type with an optional `onMessage` function:

```typescript
interface WakuObjectDescriptor<
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectMetadata {
	onMessage?: (
		message: DataMessage<DataMessageType>,
		args: WakuObjectArgs<StoreType, DataMessageType, ViewType>,
	) => Promise<void>
}
```

The type definition looks a bit packed, because of the type parameters but what can be seen here is that there is function definition (`onMessage`) which is called with two arguments: `message` which is a [`DataMessage`](#datamessage-type) and `args` which has the type `WakuObjectArgs`. If the object provides an implementation of this function, it will be called for every `DataMessage` that is originated from the same `objectId` and `instanceId`. There are additional type parameters that can provide type safety when one is using the SDK from Typescript. The second argument is the instance specific `args`, it contains information about the chat context and functions that can be used to access different services (blockchain, storage etc.) that the SDK provides.

#### Args

```typescript
export interface WakuObjectArgs<
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectContext<StoreType, DataMessageType, ViewType>,
		WakuObjectState {}
```

The `WakuObjectArgs` type is made up of the `WakuObjectContext` and the `WakuObjectState` types. Let's see their definitions:

```typescript
export interface WakuObjectContext<
	StoreType = JSONSerializable,
	DataMessageType = JSONSerializable,
	ViewType extends string = string,
> extends WakuObjectContextProps<StoreType, ViewType>,
		WakuObjectAdapter {
	updateStore: (updater: (state?: StoreType) => StoreType) => void

	send: (data: DataMessageType) => Promise<void>

	onViewChange: (view: ViewType, ...rest: string[]) => void
}
```

The context is further made up of the `WakuObjectContextProps` and the `WakuObjectAdapter` types. `send` can be used to send a `DataMessage` to another instance. For example this can be used to notify the widgets for other chat participants about the state changes of a transaction or user actions, so that on the UI everything is kept up-to-date.

It also provides functions to update the props that come from `WakuObjectContextProps`:

```typescript
export interface WakuObjectContextProps<
	StoreType = JSONSerializable,
	ViewType extends string = string,
> {
	readonly store?: StoreType
	readonly view?: ViewType
	readonly viewParams: string[] // Other path params after the screen
}
```

The `store` variable holds the state of the internal store for the object instance. The store is not shared between the instances participating in the chat, but it is unique per user. It is however saved to persistent storage, so it will keep the state after the application is reloaded. Usually the store is updated when a `DataMessage` arrives or when the user initiates a UI action.

The `view` field can be used to store the navigation state of an object, so that a given URL opens a given screen in standalone mode for the object. The `viewParams` can be used to store extra transient information in the URL (e.g. transaction hash). The `onViewChange` function can be used to change the `view` and `viewParams` fields.

#### Adapter

The context also contains the adapter interface:

```typescript
export interface WakuObjectAdapter {
	getTransaction(txHash: string): Promise<Transaction | undefined>
	getTransactionState(txHash: string): Promise<TransactionState>
	waitForTransaction(txHash: string): Promise<TransactionState>
	checkBalance(token: TokenAmount): Promise<void>
	sendTransaction: (to: string, token: TokenAmount) => Promise<string>
	estimateTransaction: (to: string, token: TokenAmount) => Promise<TokenAmount>
	getContract(address: string, abi: Interface): Contract
}
```

The `WakuObjectAdapter` provides basic blockchain functionality and most of these functions are self-explanatory. The `checkBalance` looks up the balance for a certain token and updates the `WakuObjectState` (see later). The `getContract` returns an `ethers` version 6 `Contract` type, when provided a contract `address` and an `abi` imported from a JSON file. Then the functionality provided by the contract can be accessed through the returned `Contract` object, just like in the [ethers library](https://docs.ethers.org/v6/).

#### State

And finally the last piece of `args` is the state:

```typescript
export interface WakuObjectState {
	readonly chatId: string
	readonly objectId: string
	readonly instanceId: string
	readonly profile: User
	readonly users: User[]
	readonly tokens: TokenAmount[]
	readonly exchangeRates: Map<string, ExchangeRateRecord>
	readonly fiatSymbol: string
	readonly chatName: string
}
```

The state contains all the important information about the chat context, the different ids, the details of the participants in the chat, the available token types and exchange rates.

### External objects

There are two major ways objects can be defined: internal and external. Internal means that the object is implemented in the codebase of the host application and these object types may dependencies and access the internal functionality of the host application, therefore they may not be portable across different host applications and they may be potentially less secure, but they are easier to implement.

External objects are independent of the host application and only depend on the Waku Object SDK. They run in a sandboxed environment and communicate using [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) internally in the SDK. Therefore they are more portable and more secure.

Currently external object support is at the proof-of-concept stage, most things work (except for `Contract` calls) but it is not tested intensively and may be harder to use.

All the source code for external objects can be found in the [Waku Objects repo](https://github.com/logos-innovation-lab/waku-objects). It is a monorepo that produces two `npm` packages:

- The adapter package called `@waku-objects/adapter`, in the `packages/adapter` folder
- The sandbox example packaged called `@waku-objects/sandbox-example`, in the `objects/sandbox-example` folder

#### External adapter

The adapter package provides the [type definitions](#types) and the functionality to bridge between iframe sandbox and the host application. It exports one function that the external object may call at startup:

```typescript
interface EventListenerOptions {
	onDataMessage: (dataMessage: DataMessage, args: WakuObjectArgs) => Promise<void>
	onArgsChange: (args: WakuObjectArgs) => Promise<void>
}

export function startEventListener(options: Partial<EventListenerOptions>)
```

By calling the `startEventListener` and providing the callbacks the object may listen to incoming [data messages](#datamessage-type) or context or state changes. The `onDataMessage` is called when there is an incoming data message. This can be used to implement the "backend" logic of an object (e.g. a state machine). The `onArgsChange` is called when the `args` change. This can be used to update the UI state when something changes.

There is also a function that needs to be called after the object is first rendered and its size is properly calculated in the DOM. This is necessary for the object to look properly in the host application.

```typescript
export function updateSize()
```

#### Sandbox example object

The sandbox example is a very simple implementation of an external Waku Object that uses Svelte and the adapter package. It creates a chat widget with a button that can be used to fetch information about a transaction with the help of the SDK. Therefore it is not very useful for end-users, but it demonstrates the usage of the SDK,

#### Package conventions

External objects need to expose some [metadata](#metadata) so that they can be used in a host application. The `objectId` is usually the name of the `npm` package, so there must be a `name`, `description` and logo exposed as an SVG file. The `name` and `description` is expected to be exposed in a `metadata.json` file in the `object` folder of the package, along with an `index.js` file that contains the code for the object. The sandbox example project provides an example how to do this.

Because there is only one `index.js` is loaded the object may decide if it is rendering a chat widget or a standalone view by querying the style class information of the top-level element called `app`:

```typescript
document.getElementById('app').class // 'chat' | 'standalone'
```

### Create your own Waku Object

Start by creating an empty project and install the `@waku-object/adapter` as dependency. Add a `metadata.json` as described in the [package conventions](#package-conventions) and make sure that the output `index.js` of the project will be put in a folder called `object` alongside with the metadata. For Svelte (Vite) projects you can check the sandbox example how to do it.

Then in the main application file import the `startEventListener` from the `@waku-object/adapter` and call it when the application is mounted. Using the callbacks `onDataMessage` and `onArgsChange` can update the local state of the component and trigger a rerender. The object code may access external services through the `args` object.

An important detail is that in order the chat widget renders in an appropriate size it needs to notify the host application about its size after rendered. How this can be done may be different across frontend libraries but usually a call for the `updateSize` function from the `@waku-object/adapter` needs to be done in a lifecycle function. For example in Svelte it must be called from `afterUpdate`.

### Future directions

There are many things that can be done to improve the system. Security can be improved by making the Content Security Policy stricter and implementing validations in the external adapter package. There can be external services added to the adapter for decentralised storage or location along with revokable user permissions.

The biggest impact and a low hanging fruit could be to add frontend library specific external adapter that takes care of the mundane details described in the previous two points.

Another could be to make a separate UI library with the components adhering to the design guidelines and the theming capabilities of the app.

Ultimately a goal could be to make external objects as easy to use as internal objects and therefore eliminating the need for internal objects. Then all different chat applications supporting Waku Objects could be augmented with potentially the set of all available object types.

## Resources

- [Design guidelines](https://www.wakuplay.im/design)
- [Waku Play website](https://www.wakuplay.im/)
- [Waku Objects Playground repo](https://github.com/logos-innovation-lab/waku-objects-playground)
- [Waku Objects repo](https://github.com/logos-innovation-lab/waku-objects)
- [Luminance library repo](https://github.com/logos-innovation-lab/luminance)
- [Ethers v6 library documentation](https://docs.ethers.org/v6/)
