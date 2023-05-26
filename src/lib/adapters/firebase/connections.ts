import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: 'AIzaSyCs8WujyoHcDqTFtG5b3R3HJVEyWmOCMpA',
	authDomain: 'waku-objects.firebaseapp.com',
	projectId: 'waku-objects',
	storageBucket: 'waku-objects.appspot.com',
	messagingSenderId: '824762862617',
	appId: '1:824762862617:web:4fe585c2d751a1d4586e88',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
