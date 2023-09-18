import { Interface } from 'ethers'
import type { GetContract } from './types'
import splitterFactoryAbi from './contracts/abis/splitter-factory.json'
import splitterAbi from './contracts//abis/splitter.json'
import { defaultBlockchainNetwork } from '$lib/adapters/transaction'
import type { Balance } from './schemas'
import type { Splitter, SplitterFactory } from './contracts/types'

const splitterFactoryAddress = defaultBlockchainNetwork.objects.splitterFactory

function getSplitterContract(getContract: GetContract, splitterAddress: string): Splitter {
	return getContract(splitterAddress, new Interface(splitterAbi)) as unknown as Splitter
}

function getSplitterContractFactory(getContract: GetContract): SplitterFactory {
	return getContract(
		splitterFactoryAddress,
		new Interface(splitterFactoryAbi),
	) as unknown as SplitterFactory
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createSplitterContract(
	getContract: GetContract,
	members: string[],
	token = '0x0000000000000000000000000000000000000000',
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<string> {
	const splitterFactory = getSplitterContractFactory(getContract)

	// TODO: this should be `once` with appropriate filter instead of `on`
	const events: { address: string; txHash: string }[] = []

	splitterFactory.addListener(
		splitterFactory.getEvent('SplitterCreated'),
		(address, metadata, token, members, payload) => {
			events.push({ address, txHash: payload.log.transactionHash })
		},
	)

	// TODO: Maybe we don't need metadata
	const tx = await splitterFactory.create(metadata, token, members)
	const receipt = await tx.wait()

	if (!receipt || receipt.status !== 1) {
		throw new Error('Failed to create splitter contract')
	}

	let splitterAddress: string | undefined = undefined
	const sleepTimeout = 10000
	const sleepTime = 100
	// TODO: refactor into promise
	for (
		let elapsedTime = 0;
		elapsedTime < sleepTimeout && splitterAddress === undefined;
		elapsedTime += sleepTime
	) {
		splitterAddress = events.find((e) => e.txHash === tx.hash)?.address
		await sleep(sleepTime)
	}
	splitterFactory.removeAllListeners(splitterFactory.getEvent('SplitterCreated'))

	if (!splitterAddress) throw new Error('Failed to create splitter contract')

	return splitterAddress
}

export async function estimateCreateSplitterContract(
	getContract: GetContract,
	members: string[],
	token = '0x0000000000000000000000000000000000000000',
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<bigint> {
	const splitterFactory = getSplitterContractFactory(getContract)

	const gasEstimate: bigint = await splitterFactory.create.estimateGas(metadata, token, members)

	const provider = splitterFactory.runner?.provider
	if (!provider) throw new Error('Could not estimate transaction fee')

	const fee = await provider.getFeeData()

	if (fee.maxFeePerGas && fee.maxPriorityFeePerGas)
		return gasEstimate * (fee.maxFeePerGas + fee.maxPriorityFeePerGas)
	else if (fee.gasPrice) return gasEstimate * fee.gasPrice

	throw new Error('Could not estimate transaction fee')
}

export async function getMasterSplitterContractAddress(getContract: GetContract): Promise<string> {
	const splitterFactory = getSplitterContractFactory(getContract)
	return await splitterFactory.masterSplitter()
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

export async function estimateAddExpense(
	getContract: GetContract,
	splitterAddress: string,
	amount: bigint,
	from: string,
	members: string[],
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<bigint> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	const gasEstimate: bigint = await splitter.addExpense.estimateGas(metadata, amount, from, members)

	const provider = splitter.runner?.provider
	if (!provider) throw new Error('Could not estimate transaction fee')

	const fee = await provider.getFeeData()

	if (fee.maxFeePerGas && fee.maxPriorityFeePerGas)
		return gasEstimate * (fee.maxFeePerGas + fee.maxPriorityFeePerGas)
	else if (fee.gasPrice) return gasEstimate * fee.gasPrice

	throw new Error('Could not estimate transaction fee')
}

export async function settleDebt(
	getContract: GetContract,
	splitterAddress: string,
	from: string,
): Promise<string> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	const value = await splitter.debts(from)
	const tx = await splitter['settleDebts(address)'](from, { gasLimit: 3000000n, value })
	const receipt = await tx.wait()

	if (!receipt || receipt.status !== 1) {
		console.error(receipt)
		throw new Error('Failed to settle debt')
	}
	return tx.hash
}

export async function getBalances(
	getContract: GetContract,
	splitterAddress: string,
): Promise<Balance[]> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	const members = await splitter.getMembers()

	const balances: Balance[] = []
	for (const member of members) {
		const debt = await splitter.debts(member)
		balances.push({
			address: member,
			amount: debt.toString(),
		})
	}

	return balances
}
