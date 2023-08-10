import { describe, it, expect } from 'vitest'
import { replaceUrlToLink } from './text'

describe('replaceUrlToLink', () => {
	const values = [
		{
			text: 'www.hello.com',
			expected: '<a href="https://www.hello.com" target="_blank">www.hello.com</a>',
		},
		{ text: 'hello.com', expected: '<a href="https://hello.com" target="_blank">hello.com</a>' },
		{
			text: 'abcde hello.com',
			expected: 'abcde <a href="https://hello.com" target="_blank">hello.com</a>',
		},
		{
			text: 'http://127.0.0.1:5173/chat/invite',
			expected:
				'<a href="http://127.0.0.1:5173/chat/invite" target="_blank">http://127.0.0.1:5173/chat/invite</a>',
		},
		{
			text: 'a.com b.com',
			expected:
				'<a href="https://a.com" target="_blank">a.com</a> <a href="https://b.com" target="_blank">b.com</a>',
		},
	]

	values.forEach(({ text, expected }) => {
		it(`with text ${text} should return ${expected}`, () => {
			expect(replaceUrlToLink(text)).toStrictEqual(expected)
		})
	})
})
