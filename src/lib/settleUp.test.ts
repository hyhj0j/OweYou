import { describe, expect, it } from 'vitest'
import { computeNetBalances, getSettlementSummary, simplifyDebts } from './settleUp'

describe('computeNetBalances', () => {
  it('nets a single expense correctly across payer and non-payer', () => {
    const balances = computeNetBalances({
      members: [{ id: 'a' }, { id: 'b' }],
      expenses: [{ paid_by: 'a', amount: 100 }],
      shares: [
        { member_id: 'a', share_amount: 50 },
        { member_id: 'b', share_amount: 50 },
      ],
      settlements: [],
    })

    expect(balances).toEqual(
      expect.arrayContaining([
        { memberId: 'a', net: 50 },
        { memberId: 'b', net: -50 },
      ]),
    )
  })

  it('accounts for settlements as reducing the debt', () => {
    const balances = computeNetBalances({
      members: [{ id: 'a' }, { id: 'b' }],
      expenses: [{ paid_by: 'a', amount: 100 }],
      shares: [
        { member_id: 'a', share_amount: 50 },
        { member_id: 'b', share_amount: 50 },
      ],
      settlements: [{ from_member: 'b', to_member: 'a', amount: 50 }],
    })

    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b.net]))
    expect(byId.a).toBeCloseTo(0)
    expect(byId.b).toBeCloseTo(0)
  })
})

describe('simplifyDebts', () => {
  it('returns no transactions when everyone is at zero', () => {
    expect(simplifyDebts([{ memberId: 'a', net: 0 }, { memberId: 'b', net: 0 }])).toEqual([])
  })

  it('produces a single transaction for a simple two-person debt', () => {
    const tx = simplifyDebts([
      { memberId: 'a', net: 50 },
      { memberId: 'b', net: -50 },
    ])
    expect(tx).toEqual([{ from: 'b', to: 'a', amount: 50 }])
  })

  it('collapses a three-person chain into the minimal number of transactions', () => {
    // A paid for everyone, B paid nothing, C paid nothing:
    // net A=+66.66-ish, B=-33.33, C=-33.33 style rounding case.
    const tx = simplifyDebts([
      { memberId: 'a', net: 66.67 },
      { memberId: 'b', net: -33.33 },
      { memberId: 'c', net: -33.34 },
    ])
    expect(tx).toHaveLength(2)
    expect(tx.every((t) => t.to === 'a')).toBe(true)
    const total = tx.reduce((sum, t) => sum + t.amount, 0)
    expect(total).toBeCloseTo(66.67)
  })

  it('never produces more than members.length - 1 transactions for a cyclic case', () => {
    // A owes B, B owes C, C owes A the same amount -- everything nets to zero
    // per-pair, but as net balances it should collapse to zero transactions.
    const tx = simplifyDebts([
      { memberId: 'a', net: 0 },
      { memberId: 'b', net: 0 },
      { memberId: 'c', net: 0 },
    ])
    expect(tx).toEqual([])
  })

  it('handles many small debtors owing one creditor without floating point drift', () => {
    const balances = [
      { memberId: 'creditor', net: 30 },
      { memberId: 'd1', net: -10 },
      { memberId: 'd2', net: -10 },
      { memberId: 'd3', net: -10 },
    ]
    const tx = simplifyDebts(balances)
    expect(tx).toHaveLength(3)
    expect(tx.reduce((sum, t) => sum + t.amount, 0)).toBeCloseTo(30)
  })
})

describe('getSettlementSummary', () => {
  it('combines netting and simplification end to end for a roommate scenario', () => {
    // A pays $90 groceries split evenly 3 ways, B pays $30 cleaning split evenly 3 ways.
    const summary = getSettlementSummary({
      members: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      expenses: [
        { paid_by: 'a', amount: 90 },
        { paid_by: 'b', amount: 30 },
      ],
      shares: [
        { member_id: 'a', share_amount: 30 },
        { member_id: 'b', share_amount: 30 },
        { member_id: 'c', share_amount: 30 },
        { member_id: 'a', share_amount: 10 },
        { member_id: 'b', share_amount: 10 },
        { member_id: 'c', share_amount: 10 },
      ],
      settlements: [],
    })

    // a: +90-30-10=+50, b: +30-30-10=-10, c: -30-10=-40
    expect(summary).toHaveLength(2)
    expect(summary.every((t) => t.to === 'a')).toBe(true)
    const byFrom = Object.fromEntries(summary.map((t) => [t.from, t.amount]))
    expect(byFrom.b).toBeCloseTo(10)
    expect(byFrom.c).toBeCloseTo(40)
  })
})
