import type { DraftChat } from '$lib/stores/chat'
import type { BaseWallet } from 'ethers'
import WakuAdapter from './waku'
import type { Token } from '$lib/stores/balances'

export interface Adapter {
	onLogIn: (wallet: BaseWallet) => Promise<void>
	onLogOut: () => void
	saveUserProfile(address: string, name?: string, avatar?: string): Promise<void>

	startChat(address: string, chat: DraftChat): Promise<string>
	startGroupChat(chat: DraftChat): Promise<string>

	sendChatMessage(wallet: BaseWallet, chatId: string, text: string): Promise<void>
	sendData(
		wallet: BaseWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: unknown,
	): Promise<void>

	uploadPicture(picture: string): Promise<string>
	getPicture(cid: string): string

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
