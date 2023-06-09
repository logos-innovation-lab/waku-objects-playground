import type { DraftChat } from '$lib/stores/chat'
import type { BaseWallet } from 'ethers'
import { getFromLocalStorage } from '$lib/utils/localstorage'
import FirebaseAdapter from './firebase'
import WakuAdapter from './waku'
import type { Token } from '$lib/stores/balances'

export interface Adapter {
	onLogIn: (wallet: BaseWallet) => Promise<void>
	onLogOut: () => void
	saveUserProfile(address: string, name?: string, avatar?: string): Promise<void>

	startChat(address: string, chat: DraftChat): Promise<string>
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
	sendTransaction(wallet: BaseWallet, to: string, token: Token, fee: Token): Promise<string>
	estimateTransaction(wallet: BaseWallet, to: string, token: Token): Promise<Token>

	// THIS IS JUST FOR DEV PURPOSES
	initializeBalances(address: string): Promise<void>
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
