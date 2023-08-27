// run with npx ts-node --esm --experimental-specifier-resolution=node ./src/lib/adapters/waku/cli.ts

import { PageDirection } from '@waku/interfaces'
import { connectWaku } from './waku'
import { makeWakustore } from './wakustore'

export const queryOption = {
	pageDirection: PageDirection.BACKWARD,
	count: 100,
	timeFilter: {
		startTime: new Date(1691405697360),
		endTime: new Date(),
	},
}

async function main() {
	const waku = await connectWaku()

	// console.debug({ waku })

	const wakuStorage = makeWakustore(waku)

	// const address = '0x9B16da459b7EA266787D5beCDB12DD05854A6704'
	const address = '0xf24e1D920d552AF5075163238135850AA8ea4eB7'

	// test accounts

	// // nation gloom sound repair canoe aware curve wood custom unique chief nature
	// const w0 = '0xdc3B975bA5553872Ab784f25979A3AffC00987d1'

	// // seed brass river furnace salt gate tiger remove own canal crunch reform
	// const w1 = '0xCD50ACc8d4ea46504870B3bec5ADa1Be0a889105'

	// // soup hero bargain time relax limit ice grain ritual rose join worth
	// const w2 = '0x21e260FE091Af3a78ACC73Ca8969e08940c8f9fE'

	// // identify moral exist save broccoli spend cotton cereal bamboo bitter ignore whale
	// const w3 = '0x166b3c68bC385A7fd37b7c017277551C526f19f0'

	const startTime = new Date(1691405697360)
	const endTime = new Date()

	const doc = await wakuStorage.getDoc('profile', address)

	console.log({ doc })
}

main().catch(console.error)
