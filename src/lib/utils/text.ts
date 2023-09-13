import linkifyHMTL from 'linkify-html'

export function replaceUrlToLink(text: string) {
	return linkifyHMTL(text, {
		target: '_blank',
		defaultProtocol: 'https',
	})
}

export function replaceAtMention(text: string) {
	return text.replaceAll(/(@\w+)([^\w]|$)/g, '<b>$1</b>$2')
}

function replaceNewlineToLineBreak(text: string) {
	return text.replaceAll('\n', '</br>')
}

export function textToHTML(text: string) {
	return replaceUrlToLink(replaceNewlineToLineBreak(replaceAtMention(text)))
}
