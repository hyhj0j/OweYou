import type { Expense, ExpenseShare, Settlement } from './db.types'

/**
 * True once a settlement exists between this expense's payer and one of its
 * (non-payer) participants, recorded after the expense was created.
 *
 * getSettlementSummary() only ever creates a "participant owes payer" debt
 * per expense -- never a debt between two participants -- so that's the only
 * relationship a later edit to this expense could retroactively invalidate.
 * A settlement between two people who were both in the expense but neither
 * is the payer, or a settlement recorded before the expense existed, has
 * nothing to do with this expense's numbers and doesn't lock it.
 */
export function isExpenseLocked(expense: Expense, shares: ExpenseShare[], settlements: Settlement[]): boolean {
  const participantIds = new Set(
    shares.filter((s) => s.expense_id === expense.id).map((s) => s.member_id),
  )
  const createdAt = new Date(expense.created_at).getTime()

  return settlements.some((s) => {
    if (new Date(s.settled_at).getTime() <= createdAt) return false
    const other =
      s.from_member === expense.paid_by ? s.to_member : s.to_member === expense.paid_by ? s.from_member : null
    return other !== null && other !== expense.paid_by && participantIds.has(other)
  })
}
