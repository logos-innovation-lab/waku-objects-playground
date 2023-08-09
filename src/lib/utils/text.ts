function replaceUrlToLink(text: string) {
	// from here: https://stackoverflow.com/questions/6038061/regular-expression-to-find-urls-within-a-string
	const regex =
		// eslint-disable-next-line no-useless-escape
		/((?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$]))/gim
	return text.replace(regex, `<a href="$1" target="_blank">$1</a>`)
}

function replaceNewlineToLineBreak(text: string) {
	return text.replaceAll('\n', '</br>')
}

export function textToHTML(text: string) {
	return replaceUrlToLink(replaceNewlineToLineBreak(text))
}
