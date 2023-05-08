import { browser } from '$app/environment'

export function formatDateAndTime(timestamp: number) {
	if (!browser) {
		return ''
	}
	const locale = navigator.language
	const date = new Date(timestamp)

	const dateFormat = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	})
	let dateString = dateFormat.format(date)

	const today = new Date()
	const yesterday = new Date(today).setDate(today.getDate() - 1)

	if (dateString === dateFormat.format(today)) {
		// dateString = 'Today'
		dateString = ''
	} else if (dateString === dateFormat.format(yesterday)) {
		dateString = 'Yesterday'
	}

	const timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric' })
	const dateTime = timeFormat.format(date)

	// return `${dateString} • ${dateTime}`
	return `${dateString} ${dateTime}`
}
