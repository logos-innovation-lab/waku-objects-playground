export default {
	HOME: '/',
	IDENTITY: '/identity/',
	IDENTITY_NEW: '/identity/new',
	IDENTITY_CONFIRM: '/identity/confirm',
	IDENTITY_CONNECT: '/identity/connect',
	IDENTITY_ACCOUNT: '/identity/account',
	IDENTITY_BACKUP: '/identity/backup',
	IDENTITY_CHAT: '/identity/chat',
	IDENTITY_PREFERRENCES: '/identity/preferrences',
	CHAT: (id: string) => `/chat/${id}`,
	INVITE: (address: string) => `/invite/${address}`,
	OBJECTS: (id: string) => `/chat/${id}/object/new`,
	OBJECT: (id: string, objectId: string, instanceId: string, view?: string) =>
		`/chat/${id}/object/${objectId}/${instanceId}${view ? `/${view}` : ''}`,
	GROUP_NEW: `/group/new`,
	GROUP_CHAT: (id: string) => `/group/chat/${id}`,
	GROUP_EDIT: (id: string) => `/group/chat/${id}/edit`,
}
