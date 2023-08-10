import linkifyHMTL from 'linkify-html'

export function replaceUrlToLink(text: string) {
	return linkifyHMTL(text, {
		target: '_blank',
		defaultProtocol: 'https',
	})
}

function replaceNewlineToLineBreak(text: string) {
	return text.replaceAll('\n', '</br>')
}

export function textToHTML(text: string) {
	return replaceUrlToLink(replaceNewlineToLineBreak(text))
}
