import { Wallet, HDNodeWallet } from 'ethers'
import type { AdapterBase } from '..'
import { profile } from '$lib/stores/profile'
import { Mnemonic12Schema, type Mnemonic12 } from '$lib/utils/schemas'
import { getFromLocalStorage, removeFromLocalStorage, saveToLocalStorage } from '../utils'
import { ipfs, IPFS_GATEWAY } from './connections'

export default class Base implements AdapterBase {
	protected wallet: HDNodeWallet | undefined
	protected subscriptions: Array<() => unknown> = []
	protected userSubscriptions: Array<() => unknown> = []

	start() {
		const mnemonic = getFromLocalStorage<Mnemonic12>('mnemonic', Mnemonic12Schema)
		if (mnemonic) {
			this.restoreWallet(mnemonic)
		} else {
			profile.update((state) => ({ ...state, loading: false }))
		}
	}

	stop() {
		this.subscriptions.forEach((s) => s())
		this.userSubscriptions.forEach((s) => s())
	}

	async createWallet(): Promise<void> {
		this.wallet = Wallet.createRandom()

		const phrase = this.wallet.mnemonic?.phrase
		if (!phrase) {
			console.error('No mnemonic found in wallet')
			return
		}
		saveToLocalStorage('mnemonic', phrase)
	}

	restoreWallet(mnemonic: string): Promise<void> {
		// Create a new wallet from the mnemonic
		this.wallet = Wallet.fromPhrase(mnemonic)

		const phrase = this.wallet.mnemonic?.phrase
		if (!phrase) {
			console.error('No mnemonic found in wallet')
			return Promise.resolve()
		}
		saveToLocalStorage('mnemonic', phrase)

		return Promise.resolve()
	}
	disconnectWallet(): Promise<void> {
		this.wallet = undefined
		removeFromLocalStorage('mnemonic')

		return Promise.resolve()
	}

	hasWallet() {
		return (
			Boolean(this.wallet) || getFromLocalStorage<Mnemonic12>('mnemonic', Mnemonic12Schema) !== null
		)
	}

	getMnemonics(): string {
		const phrase = this.wallet?.mnemonic?.phrase
		if (!phrase) {
			throw 'No mnemonic found in wallet'
		}
		return phrase
	}

	async uploadPicture(picture: string): Promise<string> {
		const blob = await (await fetch(picture)).blob()
		const res = await ipfs.add(blob)

		return res.cid.toString()
	}

	getPicture(cid: string): string {
		return `${IPFS_GATEWAY}/${cid}`
	}
}
