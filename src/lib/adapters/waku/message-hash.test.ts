import { describe, it, expect } from 'vitest'
import { hashMessage } from './message-hash'

/*
 * https://rfc.vac.dev/spec/14/#test-vectors
 */
describe('test vectors', () => {
	const pubsubTopic = '/waku/2/default-waku/proto'
	const messagePayload = '0x010203045445535405060708'
	const messageContentTopic = '/waku/2/default-content/proto'

	it('waku message hash computation (meta size of 12 bytes)', () => {
		const messageMeta = '0x73757065722d736563726574'
		const exptectedHash = '0x4fdde1099c9f77f6dae8147b6b3179aba1fc8e14a7bf35203fc253ee479f135f'

		const hash = hashMessage(messagePayload, messageContentTopic, messageMeta, pubsubTopic)

		expect(hash).toEqual(exptectedHash)
	})

	it('waku message hash computation (meta size of 64 bytes)', () => {
		const messageMeta =
			'0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f'
		const exptectedHash = '0xc32ed3b51f0c432be1c7f50880110e1a1a60f6067cd8193ca946909efe1b26ad'

		const hash = hashMessage(messagePayload, messageContentTopic, messageMeta, pubsubTopic)

		expect(hash).toEqual(exptectedHash)
	})

	it('waku message hash computation (meta attribute not present)', () => {
		const exptectedHash = '0x87619d05e563521d9126749b45bd4cc2430df0607e77e23572d874ed9c1aaa62'

		const hash = hashMessage(messagePayload, messageContentTopic)

		expect(hash).toEqual(exptectedHash)
	})

	it('waku message hash computation (payload length 0)', () => {
		const messagePayload = ''
		const messageMeta = '0x73757065722d736563726574'
		const exptectedHash = '0xe1a9596237dbe2cc8aaf4b838c46a7052df6bc0d42ba214b998a8bfdbe8487d6'

		const hash = hashMessage(messagePayload, messageContentTopic, messageMeta)

		expect(hash).toEqual(exptectedHash)
	})
})
