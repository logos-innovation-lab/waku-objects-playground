import { type Signer, type Eip1193Provider, BrowserProvider, type Networkish } from 'ethers'
import { browser } from '$app/environment'
import { profile } from '$lib/stores/profile'

type EthEvents = 'accountsChanged' | 'chainChanged'
type Ethereum = Eip1193Provider & {
	on: (eventName: EthEvents, eventHandler: () => void) => void
	removeListener: (eventName: EthEvents, eventHandler: () => void) => void
}
type WindowWithMaybeEthereum = Window & typeof globalThis & { ethereum: Ethereum | undefined }
type WindowWithEthereum = Window & typeof globalThis & { ethereum: Ethereum }

export async function connectWallet(network?: Networkish): Promise<Signer> {
	if (canConnectWallet()) {
		const provider = new BrowserProvider((window as WindowWithEthereum).ethereum, network)
		await provider.send('eth_requestAccounts', [])
		return provider.getSigner()
	} else {
		throw new Error('No ethereum provider found')
	}
}

export function canConnectWallet() {
	return browser && isWindowWithEthereum(window as WindowWithMaybeEthereum)
}
function isWindowWithEthereum(
	windowObject: WindowWithMaybeEthereum,
): windowObject is WindowWithEthereum {
	return typeof windowObject.ethereum !== 'undefined'
}

const windowWithEthereum = browser && (window as WindowWithEthereum)

function onAccountChanged() {
	// Clear profile
	profile.set({ loading: true })
}

export function subscribeAccountChanged(): () => unknown {
	if (
		windowWithEthereum &&
		windowWithEthereum.ethereum &&
		typeof windowWithEthereum.ethereum.on === 'function'
	) {
		windowWithEthereum.ethereum.on('accountsChanged', onAccountChanged)
		return () => {
			windowWithEthereum &&
				windowWithEthereum.ethereum.removeListener('accountsChanged', onAccountChanged)
		}
	}
	return () => console.error('No ethereum provider')
}

function onChainChanged() {
	browser && window.location.reload()
}

export function subscribeChainChanged() {
	if (
		windowWithEthereum &&
		windowWithEthereum.ethereum &&
		typeof windowWithEthereum.ethereum.on === 'function'
	) {
		windowWithEthereum.ethereum.on('chainChanged', onChainChanged)

		return () => {
			windowWithEthereum &&
				windowWithEthereum &&
				windowWithEthereum.ethereum.removeListener('chainChanged', onChainChanged)
		}
	}
	return () => console.error('No ethereum provider')
}
