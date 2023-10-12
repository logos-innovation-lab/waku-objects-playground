import { Interface, type Provider } from 'ethers'
import type { GetContract } from './types'
import splitterFactoryAbi from './contracts/abis/splitter-factory.json'
import splitterAbi from './contracts/abis/splitter.json'
import type { Balance } from './schemas'
import type { Splitter, SplitterFactory } from './contracts/types'

function getSplitterFactoryAddress(chainId: bigint) {
	switch (chainId) {
		case 100n:
			return '0x99873C280c0c4A5460AB781e4bcD06f6B5f35717'
		case 10200n:
			return '0x941DDB22a33FC753d3E7b82cc34c47Ee605e60a3'
		default:
			throw new Error('Unsupported chainId')
	}
}

function getSplitterContract(getContract: GetContract, splitterAddress: string): Splitter {
	return getContract(splitterAddress, new Interface(splitterAbi)) as unknown as Splitter
}

function getSplitterContractFactory(getContract: GetContract, chainId: bigint): SplitterFactory {
	return getContract(
		getSplitterFactoryAddress(chainId),
		new Interface(splitterFactoryAbi),
	) as unknown as SplitterFactory
}

async function calculateFee(provider: Provider, gasEstimate: bigint): Promise<bigint> {
	const fee = await provider.getFeeData()

	if (fee.maxFeePerGas && fee.maxPriorityFeePerGas)
		return gasEstimate * (fee.maxFeePerGas + fee.maxPriorityFeePerGas)
	else if (fee.gasPrice) return gasEstimate * fee.gasPrice

	throw new Error('Could not estimate transaction fee')
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createSplitterContract(
	getContract: GetContract,
	chainId: bigint,
	members: string[],
	token = '0x0000000000000000000000000000000000000000',
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<string> {
	const splitterFactory = getSplitterContractFactory(getContract, chainId)

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
	chainId: bigint,
	members: string[],
	token = '0x0000000000000000000000000000000000000000',
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<bigint> {
	const splitterFactory = getSplitterContractFactory(getContract, chainId)

	const gasEstimate: bigint = await splitterFactory.create.estimateGas(metadata, token, members)

	const provider = splitterFactory.runner?.provider
	if (!provider) throw new Error('Could not estimate transaction fee')

	return calculateFee(provider, gasEstimate)
}

export async function getMasterSplitterContractAddress(
	getContract: GetContract,
	chainId: bigint,
): Promise<string> {
	const splitterFactory = getSplitterContractFactory(getContract, chainId)
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
	chainId: bigint,
	splitterAddress: string | undefined,
	amount: bigint,
	from: string,
	members: string[],
	metadata = '0x0000000000000000000000000000000000000000',
): Promise<bigint> {
	let gasEstimate: bigint
	let splitter: Splitter
	if (splitterAddress) {
		splitter = getSplitterContract(getContract, splitterAddress)
		gasEstimate = await splitter.addExpense.estimateGas(metadata, amount, from, members)
	} else {
		// This is worse case estimateAddExpense cost
		// we can not do it by estimating the transaction because we don't have the splitter contract deployed and the transaction would fail in the master splitter contract
		gasEstimate = 47530n + 9000n * BigInt(members.length - 2)
		splitter = getSplitterContract(
			getContract,
			await getMasterSplitterContractAddress(getContract, chainId),
		)
	}

	const provider = splitter.runner?.provider
	if (!provider) throw new Error('Could not estimate transaction fee')

	return calculateFee(provider, gasEstimate)
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

export async function estimateSettleDebt(
	getContract: GetContract,
	splitterAddress: string,
	from: string,
): Promise<bigint> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	const value = await splitter.debts(from)
	const gasEstimate = await splitter['settleDebts(address)'].estimateGas(from, { value })

	const provider = splitter.runner?.provider
	if (!provider) throw new Error('Could not estimate transaction fee')

	return calculateFee(provider, gasEstimate)
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

export async function getOwedAmount(
	getContract: GetContract,
	splitterAddress: string,
	from: string,
): Promise<bigint> {
	const splitter = getSplitterContract(getContract, splitterAddress)
	return await splitter.debts(from)
}
