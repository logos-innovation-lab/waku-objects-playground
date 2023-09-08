import type { Token } from '$lib/stores/balances'
import WakuAdapter from '$lib/adapters/waku'
import type { BaseWallet } from 'ethers'
import type { User } from '$lib/objects/schemas'
import type { JSONSerializable } from '$lib/objects'

export interface Adapter {
	onLogIn: (wallet: BaseWallet) => Promise<void>
	onLogOut: () => void
	saveUserProfile(address: string, name?: string, avatar?: string): Promise<void>
	getUserProfile(address: string): Promise<User | undefined>

	startChat(address: string, peerAddress: string): Promise<string>
	startGroupChat(
		wallet: BaseWallet,
		memberAddresses: string[],
		name: string,
		avatar?: string,
	): Promise<string>

	addMemberToGroupChat(chatId: string, users: string[]): Promise<void>
	removeFromGroupChat(chatId: string, address: string): Promise<void>
	saveGroupChatProfile(chatId: string): Promise<void>

	sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void>
	sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: JSONSerializable,
	): Promise<void>
	sendInvite(wallet: BaseWallet, chatId: string, users: string[]): Promise<void>

	updateStore(
		address: string,
		objectId: string,
		instanceId: string,
		updater: (state: JSONSerializable) => JSONSerializable,
	): Promise<void>
	sendTransaction(wallet: BaseWallet, to: string, token: Token): Promise<string>
	estimateTransaction(wallet: BaseWallet, to: string, token: Token): Promise<Token>
}

export default new WakuAdapter()
