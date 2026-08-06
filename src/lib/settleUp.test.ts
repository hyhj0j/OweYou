import { describe, expect, it } from 'vitest'
import { getSettlementSummary } from './settleUp'

describe('getSettlementSummary', () => {
  it('nets a single expense to one transaction', () => {
    const tx = getSettlementSummary({
      expenses: [{ id: 'e1', paid_by: 'a', amount: 100 }],
      shares: [
        { expense_id: 'e1', member_id: 'a', share_amount: 50 },
        { expense_id: 'e1', member_id: 'b', share_amount: 50 },
      ],
      settlements: [],
    })
    expect(tx).toEqual([{ from: 'b', to: 'a', amount: 50 }])
  })

  it('nets bidirectional debts between the same pair down to a single transaction', () => {
    // a pays for a+b, then b pays for a+b -- they should net down to one
    // small transaction between just the two of them.
    const tx = getSettlementSummary({
      expenses: [
        { id: 'e1', paid_by: 'a', amount: 100 },
        { id: 'e2', paid_by: 'b', amount: 40 },
      ],
      shares: [
        { expense_id: 'e1', member_id: 'a', share_amount: 50 },
        { expense_id: 'e1', member_id: 'b', share_amount: 50 },
        { expense_id: 'e2', member_id: 'a', share_amount: 20 },
        { expense_id: 'e2', member_id: 'b', share_amount: 20 },
      ],
      settlements: [],
    })
    expect(tx).toEqual([{ from: 'b', to: 'a', amount: 30 }])
  })

  it('never routes a payment through someone the debtor has no direct expense with', () => {
    // Regression test for a roommate scenario: tester1's entire debt comes
    // from expenses Yeji paid for (never anything tester2 paid for), so
    // tester1 should pay Yeji in full -- not get split between Yeji and
    // tester2 just because their group-wide net balances happen to add up.
    // Costco: Yeji pays $30, split evenly 3 ways (tester1/tester2/Yeji @ $10).
    // Pizza: tester2 pays $60, split evenly (tester2/Yeji @ $30).
    // Towel: Yeji pays $30, split evenly (tester1/tester2 @ $15).
    const tx = getSettlementSummary({
      expenses: [
        { id: 'costco', paid_by: 'yeji', amount: 30 },
        { id: 'pizza', paid_by: 'tester2', amount: 60 },
        { id: 'towel', paid_by: 'yeji', amount: 30 },
      ],
      shares: [
        { expense_id: 'costco', member_id: 'tester1', share_amount: 10 },
        { expense_id: 'costco', member_id: 'tester2', share_amount: 10 },
        { expense_id: 'costco', member_id: 'yeji', share_amount: 10 },
        { expense_id: 'pizza', member_id: 'tester2', share_amount: 30 },
        { expense_id: 'pizza', member_id: 'yeji', share_amount: 30 },
        { expense_id: 'towel', member_id: 'tester1', share_amount: 15 },
        { expense_id: 'towel', member_id: 'tester2', share_amount: 15 },
      ],
      settlements: [],
    })

    expect(tx).toEqual(
      expect.arrayContaining([
        { from: 'tester1', to: 'yeji', amount: 25 },
        { from: 'yeji', to: 'tester2', amount: 5 },
      ]),
    )
    expect(tx).toHaveLength(2)
    // tester1 and tester2 never directly shared a bill where one paid the other.
    expect(tx.some((t) => (t.from === 'tester1' && t.to === 'tester2') || (t.from === 'tester2' && t.to === 'tester1'))).toBe(false)
  })

  it('treats a settlement as reducing debt only between that specific pair', () => {
    const tx = getSettlementSummary({
      expenses: [{ id: 'e1', paid_by: 'a', amount: 100 }],
      shares: [
        { expense_id: 'e1', member_id: 'a', share_amount: 50 },
        { expense_id: 'e1', member_id: 'b', share_amount: 50 },
      ],
      settlements: [{ from_member: 'b', to_member: 'a', amount: 50 }],
    })
    expect(tx).toEqual([])
  })

  it('returns no transactions when there are no expenses', () => {
    expect(getSettlementSummary({ expenses: [], shares: [], settlements: [] })).toEqual([])
  })

  it('avoids floating-point drift with many small shares', () => {
    const tx = getSettlementSummary({
      expenses: [{ id: 'e1', paid_by: 'a', amount: 30 }],
      shares: [
        { expense_id: 'e1', member_id: 'a', share_amount: 10 },
        { expense_id: 'e1', member_id: 'b', share_amount: 10 },
        { expense_id: 'e1', member_id: 'c', share_amount: 10 },
      ],
      settlements: [],
    })
    expect(tx).toHaveLength(2)
    expect(tx.every((t) => t.to === 'a')).toBe(true)
    expect(tx.reduce((sum, t) => sum + t.amount, 0)).toBeCloseTo(20)
  })

  it('does not cancel a three-person debt cycle, even though it nets to zero overall', () => {
    // a owes b 10 (only), b owes c 10 (only), c owes a 10 (only). Every
    // person's group-wide net balance is zero, but each debt is still a
    // real, separate pairwise relationship -- cancelling it would mean
    // reducing what a owes b based on a b<->c arrangement a has no part in
    // and never agreed to. All three should remain.
    const tx = getSettlementSummary({
      expenses: [
        { id: 'e1', paid_by: 'b', amount: 10 },
        { id: 'e2', paid_by: 'c', amount: 10 },
        { id: 'e3', paid_by: 'a', amount: 10 },
      ],
      shares: [
        { expense_id: 'e1', member_id: 'a', share_amount: 10 },
        { expense_id: 'e2', member_id: 'b', share_amount: 10 },
        { expense_id: 'e3', member_id: 'c', share_amount: 10 },
      ],
      settlements: [],
    })
    expect(tx).toEqual(
      expect.arrayContaining([
        { from: 'a', to: 'b', amount: 10 },
        { from: 'b', to: 'c', amount: 10 },
        { from: 'c', to: 'a', amount: 10 },
      ]),
    )
    expect(tx).toHaveLength(3)
  })
})
