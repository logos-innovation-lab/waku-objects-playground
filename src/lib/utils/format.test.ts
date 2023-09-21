import { describe, it, expect } from 'vitest'
import { toDecimal, toSignificantString, toBigInt, formatTimestamp } from './format'

describe('toDecimal', () => {
	const testValues = [
		{ amount: 1000000000000000000n, decimals: 18, expectedOut: '1.000000000000000000' },
		{ amount: 1234567890123456789n, decimals: 18, expectedOut: '1.234567890123456789' },
		{ amount: 123456789012345678900n, decimals: 18, expectedOut: '123.456789012345678900' },
		{ amount: 100n, decimals: 2, expectedOut: '1.00' },
		{ amount: 123456789n, decimals: 0, expectedOut: '123456789' },
		{ amount: 123456789n, decimals: 9, expectedOut: '0.123456789' },
		{ amount: 123456789n, decimals: 5, expectedOut: '1234.56789' },
	]

	testValues.forEach(({ amount, decimals, expectedOut }) => {
		it(`with amount=${amount} and decimals=${decimals} should return ${expectedOut}`, () => {
			expect(toDecimal(amount, decimals)).toEqual(expectedOut)
		})
	})
})

describe('toSignificantString', () => {
	const testValues = [
		{ value: '1.234567890123456789', minDecSigDigits: 0, expectedOut: '1' },
		{ value: '1.234567890123456789', minDecSigDigits: 4, expectedOut: '1.2345' },
		{ value: '0.001234567890123456', minDecSigDigits: 4, expectedOut: '0.001234' },
		{ value: '1', minDecSigDigits: 2, expectedOut: '1.00' },
		{ value: '1.234', minDecSigDigits: undefined, expectedOut: '1.23' },
		{ value: '0.00001234', minDecSigDigits: undefined, expectedOut: '0.000012' },
		{ value: '0.0000001000', minDecSigDigits: 3, expectedOut: '0.0000001' },
	]

	testValues.forEach(({ value, minDecSigDigits, expectedOut }) => {
		it(`with value=${value} and minDecSigDigits=${minDecSigDigits} should return ${expectedOut}`, () => {
			expect(toSignificantString(value, minDecSigDigits)).toEqual(expectedOut)
		})
	})
})

describe('toBigInt', () => {
	const testValues = [
		{ value: '1.234567890123456789', decimals: 18, expectedOut: 1234567890123456789n },
		{ value: '1.234567890123456789', decimals: 6, expectedOut: 1234567n },
		{ value: '0.00012345', decimals: 3, expectedOut: 0n },
		{ value: '0.0009999', decimals: 3, expectedOut: 0n },
		{ value: '0.001', decimals: 3, expectedOut: 1n },
		{ value: '0', decimals: 3, expectedOut: 0n },
		{ value: '0.0', decimals: 3, expectedOut: 0n },
		{ value: '1', decimals: 3, expectedOut: 1000n },
	]

	testValues.forEach(({ value, decimals, expectedOut }) => {
		it(`with value=${value} and decimals=${decimals} should return ${expectedOut}`, () => {
			expect(toBigInt(value, decimals)).toEqual(expectedOut)
		})
	})
})

describe('formatTimestamp', () => {
	const currentDate = new Date(1695301187859)
	const testValues = [
		{ timestamp: 1695292194040, expectedOut: '12:29' },
		{ timestamp: 1695292052039, expectedOut: '12:27' },
		{ timestamp: 1695215231556, expectedOut: 'Wed' },
		{ timestamp: 1695213720514, expectedOut: 'Wed' },
		{ timestamp: 1695213620936, expectedOut: 'Wed' },
		{ timestamp: 1695136556259, expectedOut: 'Tue' },
		{ timestamp: 1695062899168, expectedOut: 'Mon' },
		{ timestamp: 1694447288453, expectedOut: 'Sep 11' },
		{ timestamp: 1694258558099, expectedOut: 'Sep 9' },
	]

	testValues.forEach(({ timestamp, expectedOut }) => {
		it(`with timestamp=${timestamp} should return ${expectedOut}`, () => {
			expect(formatTimestamp(timestamp, currentDate)).toEqual(expectedOut)
		})
	})
})
