import { Interface } from 'ethers'
import type { SplitterFactoryContract, SplitterContract, GetContract } from './types'
import splitterFactoryAbi from './abis/splitter-factory.json'
import splitterAbi from './abis/splitter.json'
import { sleep } from './utils'
import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
import type { Balance } from './schemas'

const splitterFactoryAddress = defaultBlockchainNetwork.objects.splitterFactory

function getSplitterContract(getContract: GetContract, splitterAddress: string): SplitterContract {
	return getContract(splitterAddress, new Interface(splitterAbi)) as SplitterContract
}

export async function createSplitterContract(
	getContract: GetContract,
	members: string[],
	token = '0x0000000000000000000000000000000000000000',
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<string> {
	const splitterFactory = getContract(
		splitterFactoryAddress,
		new Interface(splitterFactoryAbi),
	) as SplitterFactoryContract
	// TODO: this should be `once` with appropriate filter instead of `on`
	const events: { address: string; txHash: string }[] = []

	splitterFactory.addListener('SplitterCreated', (address, metadata, token, members, payload) => {
		events.push({ address, txHash: payload.log.transactionHash })
	})

	// TODO: Maybe we don't need metadata
	const tx = await splitterFactory.create(metadata, token, members)
	const receipt = await tx.wait()

	if (!receipt || receipt.status !== 1) {
		throw new Error('Failed to create splitter contract')
	}

	let splitterAddress: string | undefined = undefined
	for (let sleepTime = 100; sleepTime < 2000 && splitterAddress === undefined; sleepTime += 100) {
		splitterAddress = events.find((e) => e.txHash === tx.hash)?.address
		await sleep(sleepTime)
	}
	splitterFactory.removeAllListeners('SplitterCreated')

	if (!splitterAddress) throw new Error('Failed to create splitter contract')

	return splitterAddress
}

export async function addExpense(
	getContract: GetContract,
	splitterAddress: string,
	amount: bigint,
	from: string,
	members: string[],
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<string> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	const tx = await splitter.addExpense(metadata, amount, from, members)
	const receipt = await tx.wait()

	if (!receipt || receipt.status !== 1) {
		throw new Error('Failed to add expense')
	}
	return tx.hash
}

export async function settleDebt(
	getContract: GetContract,
	splitterAddress: string,
): Promise<string> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	const tx = await splitter.settleDebts()
	const receipt = await tx.wait()

	if (!receipt || receipt.status !== 1) {
		throw new Error('Failed to settle debt')
	}
	return tx.hash
}

export async function getBalances(
	getContract: GetContract,
	splitterAddress: string,
): Promise<Balance[]> {
	const splitter = getContract(splitterAddress, new Interface(splitterAbi)) as SplitterContract

	const members = await splitter.getMembers()

	const balances: Balance[] = []
	for (const member of members) {
		const debt = await splitter.debts(member)
		balances.push({
			address: member,
			amount: debt.toString(),
			decimals: defaultBlockchainNetwork.nativeToken.decimals,
		})
	}

	return balances
}
