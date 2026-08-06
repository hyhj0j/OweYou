import type { SplitType } from './db.types'

/** Largest-remainder distribution: splits totalCents across weights so the
 *  parts always sum back to exactly totalCents (no floating point drift). */
export function distributeByWeights(totalCents: number, weights: number[]): number[] {
  const sumWeights = weights.reduce((a, b) => a + b, 0)
  if (sumWeights <= 0) return weights.map(() => 0)

  const raw = weights.map((w) => (w / sumWeights) * totalCents)
  const floors = raw.map(Math.floor)
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0)

  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)

  const result = [...floors]
  for (let k = 0; k < remainder && k < order.length; k++) {
    result[order[k].i] += 1
  }
  return result
}

export type SplitResult = {
  shares: Record<string, number> // memberId -> dollars
  isValid: boolean
  remainder: number // positive = still needs assigning, negative = over-assigned (dollars for amount mode, percent points for percent mode)
}

export function computeEqualShares(amount: number, participantIds: string[]): SplitResult {
  if (participantIds.length === 0) {
    return { shares: {}, isValid: false, remainder: 0 }
  }
  const cents = distributeByWeights(Math.round(amount * 100), participantIds.map(() => 1))
  const shares = Object.fromEntries(participantIds.map((id, i) => [id, cents[i] / 100]))
  return { shares, isValid: true, remainder: 0 }
}

export function computeCustomAmountShares(amount: number, values: Record<string, string>): SplitResult {
  const entries = Object.entries(values)
    .map(([id, raw]) => [id, Number(raw) || 0] as const)
    .filter(([, value]) => value > 0)

  const sum = entries.reduce((total, [, value]) => total + value, 0)
  const remainder = Math.round((amount - sum) * 100) / 100

  return {
    shares: Object.fromEntries(entries),
    isValid: Math.abs(remainder) < 0.005 && entries.length > 0,
    remainder,
  }
}

export function computeCustomPercentShares(amount: number, values: Record<string, string>): SplitResult {
  const entries = Object.entries(values)
    .map(([id, raw]) => [id, Number(raw) || 0] as const)
    .filter(([, value]) => value > 0)

  const sumPercent = entries.reduce((total, [, value]) => total + value, 0)
  const remainder = Math.round((100 - sumPercent) * 100) / 100
  const isValid = Math.abs(remainder) < 0.01 && entries.length > 0

  if (!isValid) {
    return { shares: Object.fromEntries(entries.map(([id]) => [id, 0])), isValid: false, remainder }
  }

  const cents = distributeByWeights(
    Math.round(amount * 100),
    entries.map(([, value]) => value),
  )
  const shares = Object.fromEntries(entries.map(([id], i) => [id, cents[i] / 100]))
  return { shares, isValid: true, remainder: 0 }
}

export function computeSplit(
  mode: SplitType,
  amount: number,
  participantIds: string[],
  customValues: Record<string, string>,
): SplitResult {
  if (mode === 'equal') return computeEqualShares(amount, participantIds)
  if (mode === 'custom_amount') return computeCustomAmountShares(amount, customValues)
  return computeCustomPercentShares(amount, customValues)
}
