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

- Waku Object SDK
  - Overview
  - Types
  - External objects
  - Creating your own object type
  - Existing implementations

## Overview

Waku Objects is an open, modular system for transactional mini-applications to be built inside a chat application. Open, because it uses open standards for interoperability and provides a default [web based implementation](https://www.wakuplay.im/). Modular, because it may be implemented in any chat application that supports structured data messages that are sent alongside user messages. Transactional, because it supports blockchain transactions and smart contract interactions on Ethereum compatible blockchains.

The Waku Object concept enables building social applications, where the social context is provided by the chat (private 1on1 or group at the moment) so that there is already some implied trust between the participants. The Waku Object SDK provides an interface for objects to communicate easily with the other participants' objects and is designed to share the least information possible in a sandboxed environment with the goal of minimising the possibility of leaking private or personal.

The current implementation uses the [Waku protocol](https://waku.org/) as transport and storage layer. The objects' code may be run in a sandboxed iframe protected by [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). The communication between the application and the objects are done with JSON serializable data. Native applications may use web views provided by their appropriate platforms to display and communicate with the Waku Objects.

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

There is a field `type` that is `invite`, the `timestamp` is the number of milliseconds since the Unix Epoch in UTC. The `fromAddress` is the ethereum address of the sender as a string, prefixed with `0x`. The `chatId` field contains the id of the group encoded as string. See the [Group chats](#Group chat) for more information.

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
