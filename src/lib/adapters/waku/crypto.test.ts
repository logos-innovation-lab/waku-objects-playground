import { describe, it, expect } from 'vitest'
import { publicKeyToAddress } from './crypto'

const testPrivateKey = 'd195918969e09d9394c768e25b621eafc4c360117a9e1eebb0a68bfd53119ba4'
const testCompressedPublicKey = '0374a6b1cea74a7a755396d8c62a3be4eb9098c7bb286dcdfc02ab93e7683c93f9'
const testUncompressedPublicKey =
	'0474a6b1cea74a7a755396d8c62a3be4eb9098c7bb286dcdfc02ab93e7683c93f99515f1cf8980e0cb25b6078113813d90d99303aaea1aa34c12805f8355768e21'
const testAddress = '0x5018604b6fcfb992e48c102dcff8f9084a68b751'

describe('publicKeyToAddress', () => {
	it('calculates correct address for compressed public key', () => {
		const address = publicKeyToAddress(testCompressedPublicKey)
		expect(address).toEqual(testAddress)
	})

	it('calculates correct address for uncompressed public key', () => {
		const address = publicKeyToAddress(testUncompressedPublicKey)
		expect(address).toEqual(testAddress)
	})
})
