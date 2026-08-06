import { describe, expect, it } from 'vitest'
import { computeCustomPercentShares, computeEqualShares, distributeByWeights } from './splitCalc'

describe('distributeByWeights', () => {
  it('always sums back to the total, even with an uneven split', () => {
    const parts = distributeByWeights(1000, [1, 1, 1])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000)
  })
})

describe('computeEqualShares', () => {
  it('splits $10 three ways without losing a cent', () => {
    const { shares, isValid } = computeEqualShares(10, ['a', 'b', 'c'])
    expect(isValid).toBe(true)
    const total = Object.values(shares).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(10)
    expect(Object.values(shares).every((v) => v === 3.33 || v === 3.34)).toBe(true)
  })
})

describe('computeCustomPercentShares', () => {
  it('is invalid until percentages sum to 100', () => {
    const result = computeCustomPercentShares(100, { a: '50', b: '30' })
    expect(result.isValid).toBe(false)
    expect(result.remainder).toBeCloseTo(20)
  })

  it('distributes exactly once percentages sum to 100', () => {
    const result = computeCustomPercentShares(100, { a: '33', b: '33', c: '34' })
    expect(result.isValid).toBe(true)
    expect(Object.values(result.shares).reduce((a, b) => a + b, 0)).toBeCloseTo(100)
  })
})
