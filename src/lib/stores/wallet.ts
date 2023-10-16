import { Wallet, HDNodeWallet } from 'ethers'
import { Mnemonic12Schema, type Mnemonic12 } from '$lib/utils/schemas'
import { getFromLocalStorage, removeFromLocalStorage, saveToLocalStorage } from '../adapters/utils'
import { writable, get } from 'svelte/store'
import type { Writable } from 'svelte/store'

interface WalletState {
	wallet?: HDNodeWallet
	loading: boolean
	error?: Error
}

interface WalletStore extends Writable<WalletState> {
	getMnemonics: () => string
	hasWallet: () => boolean
	disconnectWallet: () => void
	restoreWallet: (mnemonic: string) => void
	saveWallet: (wallet: HDNodeWallet) => void
}

function storeInLocalstorage(wallet: HDNodeWallet) {
	const phrase = wallet.mnemonic?.phrase
	if (!phrase) {
		throw new Error('No mnemonic found in wallet')
	}
	saveToLocalStorage('mnemonic', phrase)
}

function createWalletStore(): WalletStore {
	const store = writable<WalletState>({ loading: true })

	const restoreWallet = (mnemonic: string) => {
		// Create a new wallet from the mnemonic
		const wallet = Wallet.fromPhrase(mnemonic)
		store.set({ wallet, loading: false })

		storeInLocalstorage(wallet)
	}

	const mnemonic = getFromLocalStorage<Mnemonic12>('mnemonic', Mnemonic12Schema)
	if (mnemonic) {
		restoreWallet(mnemonic)
	} else {
		store.set({ loading: false })
	}

	return {
		...store,
		restoreWallet,
		getMnemonics: () => {
			const phrase = get(store).wallet?.mnemonic?.phrase
			if (!phrase) {
				throw 'No mnemonic found in wallet'
			}
			return phrase
		},
		hasWallet: () => {
			return (
				Boolean(get(store).wallet) ||
				getFromLocalStorage<Mnemonic12>('mnemonic', Mnemonic12Schema) !== null
			)
		},
		disconnectWallet: () => {
			store.set({ wallet: undefined, loading: false })
			removeFromLocalStorage('mnemonic')
		},
		saveWallet: (wallet: HDNodeWallet) => {
			store.set({ wallet, loading: false })

			storeInLocalstorage(wallet)
		},
	}
}

export const walletStore = createWalletStore()
