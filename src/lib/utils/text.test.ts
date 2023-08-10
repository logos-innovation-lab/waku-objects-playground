import { describe, it, expect } from 'vitest'
import { replaceUrlToLink } from './text'

describe('replaceUrlToLink', () => {
	const values = [
		{
			text: 'www.hello.com',
			expected: '<a target="_blank" href="https://www.hello.com">www.hello.com</a>',
		},
		{ text: 'hello.com', expected: '<a target="_blank" href="https://hello.com">hello.com</a>' },
		{
			text: 'abcde hello.com',
			expected: 'abcde <a target="_blank" href="https://hello.com">hello.com</a>',
		},
		{
			text: 'http://127.0.0.1:5173/chat/invite',
			expected:
				'<a target="_blank" href="http://127.0.0.1:5173/chat/invite">http://127.0.0.1:5173/chat/invite</a>',
		},
		{
			text: 'a.com b.com',
			expected:
				'<a target="_blank" href="https://a.com">a.com</a> <a target="_blank" href="https://b.com">b.com</a>',
		},
	]

	values.forEach(({ text, expected }) => {
		it(`with text ${text} should return ${expected}`, () => {
			expect(replaceUrlToLink(text)).toStrictEqual(expected)
		})
	})
})
