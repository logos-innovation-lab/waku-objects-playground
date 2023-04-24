import type { DraftChat } from '$lib/stores/chat'
import FirebaseAdapter from './firebase'

export interface Contact {
	address: string
	name: string
	avatar?: string
}

export interface Adapter {
	// This is run when the app is mounted and should start app wide subscriptions
	start?: () => Promise<void> | void
	// This is run when the app unmounts and should clear subscriptions
	stop?: () => Promise<void> | void

	logIn(): Promise<void>
	logOut(): Promise<void>
	saveUserProfile(name?: string, avatar?: string): Promise<void>
	canLogIn(): boolean

	uploadPicture(picture: string): Promise<string>
	getPicture(cid: string): string

	startChat(chat: DraftChat): Promise<string>
	sendChatMessage(chatId: string, text: string): Promise<void>
}

export default new FirebaseAdapter() as Adapter
