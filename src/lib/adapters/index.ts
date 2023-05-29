import type { DraftChat } from '$lib/stores/chat'
import type { HDNodeWallet } from 'ethers'
import FirebaseAdapter from './firebase'
import WakuAdapter from './waku'

export interface Contact {
	address: string
	name: string
	avatar?: string
}

export interface Adapter {
	onLogIn: (wallet: HDNodeWallet) => Promise<void>
	onLogOut: () => void
	saveUserProfile(wallet: HDNodeWallet, name?: string, avatar?: string): Promise<void>

	startChat(wallet: HDNodeWallet, chat: DraftChat): Promise<string>
	sendChatMessage(wallet: HDNodeWallet, chatId: string, text: string): Promise<void>

	uploadPicture(picture: string): Promise<string>
	getPicture(cid: string): string
}

export default new WakuAdapter() as Adapter
