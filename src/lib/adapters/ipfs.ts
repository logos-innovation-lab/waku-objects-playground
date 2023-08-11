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

export async function uploadPicture(picture: string): Promise<string> {
	const blob = await (await fetch(picture)).blob()
	const res = await ipfs.add(blob)

	return res.cid.toString()
}

export function getPicture(cid: string): string {
	return `${IPFS_GATEWAY}/${cid}`
}
