import type { DraftChat } from '$lib/stores/chat'
import type { HDNodeWallet } from 'ethers'
import { getFromLocalStorage } from '$lib/utils/localstorage'
import FirebaseAdapter from './firebase'
import WakuAdapter from './waku'
import type { Token } from '$lib/stores/balances'

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

	updateStore(
		wallet: HDNodeWallet,
		objectId: string,
		instanceId: string,
		updater: (state: unknown) => unknown,
	): Promise<void>
	sendTransaction(wallet: HDNodeWallet, to: string, token: Token, fee: Token): Promise<string>
	estimateTransaction(wallet: HDNodeWallet, to: string, token: Token): Promise<Token>

	// THIS IS JUST FOR DEV PURPOSES
	initializeBalances(wallet: HDNodeWallet): Promise<void>
	checkBalance(address: string, token: Token): Promise<void>
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
