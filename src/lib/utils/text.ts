import anchorme from 'anchorme'

export function replaceUrlToLink(text: string) {
	return anchorme({
		input: text,
		options: {
			protocol: 'https://',
			attributes: {
				target: '_blank',
			},
		},
	})
}

function replaceNewlineToLineBreak(text: string) {
	return text.replaceAll('\n', '</br>')
}

export function textToHTML(text: string) {
	return replaceUrlToLink(replaceNewlineToLineBreak(text))
}
