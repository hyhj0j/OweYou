export type NetBalance = { memberId: string; net: number }
export type SettlementTransaction = { from: string; to: string; amount: number }

export type BalanceInput = {
  members: { id: string }[]
  expenses: { paid_by: string; amount: number }[]
  shares: { member_id: string; share_amount: number }[]
  settlements: { from_member: string; to_member: string; amount: number }[]
}

/**
 * Net balance per member, in currency units (positive = owed money overall,
 * negative = owes money overall). Recomputed from scratch every time it's
 * called -- group sizes here are small enough that this is cheap.
 */
export function computeNetBalances({ members, expenses, shares, settlements }: BalanceInput): NetBalance[] {
  const net = new Map<string, number>()
  for (const m of members) net.set(m.id, 0)

  for (const e of expenses) {
    net.set(e.paid_by, (net.get(e.paid_by) ?? 0) + e.amount)
  }
  for (const s of shares) {
    net.set(s.member_id, (net.get(s.member_id) ?? 0) - s.share_amount)
  }
  for (const s of settlements) {
    net.set(s.from_member, (net.get(s.from_member) ?? 0) + s.amount)
    net.set(s.to_member, (net.get(s.to_member) ?? 0) - s.amount)
  }

  return [...net.entries()].map(([memberId, net]) => ({ memberId, net }))
}

/**
 * Greedily matches the largest debtor against the largest creditor,
 * repeatedly, until every balance is zero. This isn't guaranteed to find the
 * mathematically minimal transaction count in every case, but it never
 * produces more than members.length - 1 transactions and matches the
 * standard "settle up" behaviour users expect from apps like this.
 *
 * Works in integer cents throughout to avoid floating-point drift.
 */
export function simplifyDebts(balances: NetBalance[]): SettlementTransaction[] {
  const CENTS = 100

  const debtors = balances
    .map((b) => ({ id: b.memberId, cents: -Math.round(b.net * CENTS) }))
    .filter((b) => b.cents > 0)
    .sort((a, b) => b.cents - a.cents)

  const creditors = balances
    .map((b) => ({ id: b.memberId, cents: Math.round(b.net * CENTS) }))
    .filter((b) => b.cents > 0)
    .sort((a, b) => b.cents - a.cents)

  const transactions: SettlementTransaction[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amountCents = Math.min(debtor.cents, creditor.cents)

    if (amountCents > 0) {
      transactions.push({ from: debtor.id, to: creditor.id, amount: amountCents / CENTS })
    }

    debtor.cents -= amountCents
    creditor.cents -= amountCents
    if (debtor.cents === 0) i++
    if (creditor.cents === 0) j++
  }

  return transactions
}

/** The one function most callers need: raw ledger rows in, minimal "who owes whom" list out. */
export function getSettlementSummary(input: BalanceInput): SettlementTransaction[] {
  return simplifyDebts(computeNetBalances(input))
}
