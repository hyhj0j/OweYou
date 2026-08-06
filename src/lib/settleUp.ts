export type SettlementTransaction = { from: string; to: string; amount: number }

export type BalanceInput = {
  expenses: { id: string; paid_by: string; amount: number }[]
  shares: { expense_id: string; member_id: string; share_amount: number }[]
  settlements: { from_member: string; to_member: string; amount: number }[]
}

const CENTS = 100

/**
 * "Who owes whom", computed directly from each expense's payer and shares
 * and netted pairwise between every two people -- not from each person's
 * overall balance across the whole group. This keeps a debt tied to who
 * actually fronted it: if everything you're behind on was paid by the same
 * roommate, you pay that roommate back directly. A net-balance approach
 * (rank everyone by total owed/owing, match largest debtor to largest
 * creditor) can end up routing a payment through someone who never covered
 * any of your expenses, just because their group-wide total happened to
 * line up -- mathematically valid, but not what "who owes whom" means here.
 *
 * Deliberately does NOT cancel debt cycles across three or more people (A
 * owes B, B owes C, C owes A) even when they net to zero: doing that would
 * reduce what A owes B based on a B<->C arrangement A has no part in and
 * never agreed to skip. Only a pair's own mutual debts, between exactly the
 * two people who both know about them, get netted down automatically.
 *
 * Works in integer cents throughout to avoid floating-point drift.
 */
export function getSettlementSummary({ expenses, shares, settlements }: BalanceInput): SettlementTransaction[] {
  const payerByExpense = new Map(expenses.map((e) => [e.id, e.paid_by]))

  // owed.get(`${debtor}|${creditor}`) = cents debtor owes creditor, one-directional.
  const owed = new Map<string, number>()
  function add(debtor: string, creditor: string, cents: number) {
    if (debtor === creditor || cents === 0) return
    const key = `${debtor}|${creditor}`
    owed.set(key, (owed.get(key) ?? 0) + cents)
  }

  for (const s of shares) {
    const payer = payerByExpense.get(s.expense_id)
    if (payer === undefined) continue
    add(s.member_id, payer, Math.round(s.share_amount * CENTS))
  }
  for (const s of settlements) {
    add(s.from_member, s.to_member, -Math.round(s.amount * CENTS))
  }

  const memberIds = [...new Set([...owed.keys()].flatMap((key) => key.split('|')))]

  const transactions: SettlementTransaction[] = []
  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const a = memberIds[i]
      const b = memberIds[j]
      const net = (owed.get(`${a}|${b}`) ?? 0) - (owed.get(`${b}|${a}`) ?? 0)
      if (net > 0) transactions.push({ from: a, to: b, amount: net / CENTS })
      else if (net < 0) transactions.push({ from: b, to: a, amount: -net / CENTS })
    }
  }

  return transactions.sort((x, y) => y.amount - x.amount)
}
