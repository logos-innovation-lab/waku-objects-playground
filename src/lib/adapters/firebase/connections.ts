import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { create } from 'ipfs-http-client'

const IPFS_AUTH =
	'Basic Mk5Nbk1vZUNSTWMyOTlCQjYzWm9QZzlQYTU3OjAwZTk2MmJjZTBkZmQxZWQxNGNhNmY1M2JiYjYxMTli'
export const IPFS_GATEWAY = 'https://kurate.infura-ipfs.io/ipfs'

export const ipfs = create({
	host: 'ipfs.infura.io',
	port: 5001,
	protocol: 'https',
	headers: {
		authorization: IPFS_AUTH,
	},
})

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
