import type { DraftChat } from '$lib/stores/chat'
import type { HDNodeWallet } from 'ethers'
import { getFromLocalStorage } from '$lib/utils/localstorage'
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
	sendData(
		wallet: HDNodeWallet,
		chatId: string,
		objectId: string,
		instanceId: string,
		data: unknown,
	): Promise<void>

	uploadPicture(picture: string): Promise<string>
	getPicture(cid: string): string
}

const DEFAULT_ADAPTER = 'firebase'

export const adapters = ['firebase', 'waku'] as const
export type AdapterName = (typeof adapters)[number]
export const adapterName: AdapterName = getFromLocalStorage<AdapterName>(
	'adapter',
	DEFAULT_ADAPTER as AdapterName,
)

let adapter: Adapter
switch (adapterName) {
	case 'firebase':
		adapter = new FirebaseAdapter()
		break
	case 'waku':
		adapter = new WakuAdapter()
		break
	default:
		throw new Error(`Invalid adapter ${adapterName}`)
}

export default adapter
