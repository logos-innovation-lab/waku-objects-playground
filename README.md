# Waku Objects: Playground

Waku Objects Playground is a simple chat app. Its main use is to showcase Waku Objects, develop and test them.

## Developing

Install dependencies with `pnpm install`. Then start the development server:

```bash
# bind to 127.0.0.1
pnpm dev --host

# or start the server and open the app in a new browser tab
pnpm dev --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

## CLI

There is a built-in command line tool for making development easier.

Run it with this command:

```bash
pnpm cli <command> [arguments]
```

Currently the following commands are available:

- `pnpm cli fund <address> [amount=1]`: fund an address from a builtin hardhat test account
- `pnpm cli balance <address>`: prints the balance of the account that belongs to the address
- `pnpm cli txinfo <hash>`: prints the transaction information
- `pnpm cli waku profile <address>`: prints the profile belonging to an address
- `pnpm cli waku group-chat <address>`: prints the group chats
- `pnpm cli waku chats <address>`: prints the chats object
- `pnpm cli waku private-message <address>`: prints the private messages
- `pnpm cli waku objects <address>`: prints the object store
- `pnpm cli waku send <from> <to> <message>` sends a private `message` from a user (or group) to another one
- `pnpm cli waku invite <from> <to> <chat-id>` invite a user to a group chat

## License

Licensed and distributed under either of

- MIT license: [LICENSE-MIT](https://github.com/waku-org/js-waku/blob/master/LICENSE-MIT) or http://opensource.org/licenses/MIT

or

- Apache License, Version 2.0, ([LICENSE-APACHE-v2](https://github.com/waku-org/js-waku/blob/master/LICENSE-APACHE-v2) or http://www.apache.org/licenses/LICENSE-2.0)

at your option. These files may not be copied, modified, or distributed except according to those terms.
