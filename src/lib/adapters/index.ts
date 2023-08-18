import type { DraftChat } from '$lib/stores/chat'
import type { Token } from '$lib/stores/balances'
import WakuAdapter from '$lib/adapters/waku'
import type { BaseWallet } from 'ethers'
import type { User } from '$lib/objects/schemas'

export interface Adapter {
	onLogIn: (wallet: BaseWallet) => Promise<void>
	onLogOut: () => void
	saveUserProfile(address: string, name?: string, avatar?: string): Promise<void>
	getUserProfile(address: string): Promise<User | undefined>

	startChat(address: string, peerAddress: string): Promise<string>
	startGroupChat(wallet: BaseWallet, chat: DraftChat): Promise<string>

	addMemberToGroupChat(chatId: string, users: string[]): Promise<void>

	sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void>
	sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: unknown,
	): Promise<void>
	sendInvite(wallet: BaseWallet, chatId: string, users: string[]): Promise<void>

	updateStore(
		address: string,
		objectId: string,
		instanceId: string,
		updater: (state: unknown) => unknown,
	): Promise<void>
	sendTransaction(wallet: BaseWallet, to: string, token: Token): Promise<string>
	estimateTransaction(wallet: BaseWallet, to: string, token: Token): Promise<Token>
}

export default new WakuAdapter()
