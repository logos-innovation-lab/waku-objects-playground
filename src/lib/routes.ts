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
	OBJECTS: (id: string) => `/chat/${id}/object/new`,
	OBJECT_NEW: (id: string, objectId: string, view?: string) =>
		`/chat/${id}/object/${objectId}/new${view ? `/${view}` : ''}`,
	OBJECT: (id: string, objectId: string, instanceId: string, view?: string) =>
		`/chat/${id}/object/${objectId}/${instanceId}${view ? `/${view}` : ''}`,

	REQUEST_TRANSACTION: '/request-transaction',
	SEND_TRANSACTION: '/send-transaction',
}
