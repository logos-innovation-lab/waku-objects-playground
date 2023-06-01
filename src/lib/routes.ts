export default {
	HOME: '/',
	IDENTITY: '/identity/',
	IDENTITY_NEW: '/identity/new',
	IDENTITY_CONFIRM: '/identity/confirm',
	IDENTITY_CONNECT: '/identity/connect',
	IDENTITY_ACCOUNT: '/identity/account',
	IDENTITY_BACKUP: '/identity/backup',
	CHAT: (id: string) => `/chat/${id}`,
	INVITE: (address: string) => `/invite/${address}`,

	REQUEST_TRANSACTION: '/request-transaction',
	SEND_TRANSACTION: '/send-transaction',
}
