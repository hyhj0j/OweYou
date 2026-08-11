import { describe, expect, it } from 'vitest'
import { isExpenseLocked } from './expenseLock'
import type { Expense, ExpenseShare, Settlement } from './db.types'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    group_id: 'g1',
    description: 'Costco',
    amount: '30.00',
    category_id: null,
    paid_by: 'yeji',
    expense_date: '2026-01-01',
    split_type: 'equal',
    note: null,
    created_by: 'yeji',
    created_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    deleted_by: null,
    ...overrides,
  }
}

function makeShare(member_id: string, overrides: Partial<ExpenseShare> = {}): ExpenseShare {
  return { id: `share-${member_id}`, expense_id: 'e1', member_id, share_amount: '10.00', ...overrides }
}

function makeSettlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    id: 's1',
    group_id: 'g1',
    from_member: 'tester1',
    to_member: 'yeji',
    amount: '25.00',
    note: null,
    created_by: 'tester1',
    settled_at: '2026-02-01T00:00:00Z',
    ...overrides,
  }
}

describe('isExpenseLocked', () => {
  it('locks an expense once the payer and a participant have a later settlement between them', () => {
    const expense = makeExpense()
    const shares = [makeShare('tester1'), makeShare('tester2'), makeShare('yeji')]
    const settlements = [makeSettlement({ from_member: 'tester1', to_member: 'yeji' })]
    expect(isExpenseLocked(expense, shares, settlements)).toBe(true)
  })

  it('does not lock when the settlement predates the expense', () => {
    const expense = makeExpense({ created_at: '2026-03-01T00:00:00Z' })
    const shares = [makeShare('tester1'), makeShare('yeji')]
    const settlements = [makeSettlement({ from_member: 'tester1', to_member: 'yeji', settled_at: '2026-02-01T00:00:00Z' })]
    expect(isExpenseLocked(expense, shares, settlements)).toBe(false)
  })

  it('does not lock when the settlement is between two participants, neither of whom is the payer', () => {
    const expense = makeExpense({ paid_by: 'yeji' })
    const shares = [makeShare('tester1'), makeShare('tester2'), makeShare('yeji')]
    const settlements = [makeSettlement({ from_member: 'tester1', to_member: 'tester2' })]
    expect(isExpenseLocked(expense, shares, settlements)).toBe(false)
  })

  it('does not lock when the settlement has nothing to do with this expense', () => {
    const expense = makeExpense({ paid_by: 'yeji' })
    const shares = [makeShare('tester1')]
    const settlements = [makeSettlement({ from_member: 'someoneElse', to_member: 'yetAnother' })]
    expect(isExpenseLocked(expense, shares, settlements)).toBe(false)
  })

  it('does not lock when there are no settlements at all', () => {
    const expense = makeExpense()
    const shares = [makeShare('tester1')]
    expect(isExpenseLocked(expense, shares, [])).toBe(false)
  })
})
