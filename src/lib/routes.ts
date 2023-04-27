export default {
	HOME: '/',
	PROFILE: '/profile/',
	CHAT: (id: string) => `/chat/${id}`,
	CHAT_NEW: '/chat/new',

	REQUEST_TRANSACTION: '/request-transaction',
	SEND_TRANSACTION: '/send-transaction',
}
