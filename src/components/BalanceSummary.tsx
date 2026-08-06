import { useMemo } from 'react'
import { format, useT, useLanguage } from '../i18n'
import { formatCurrency } from '../lib/currency'
import { getSettlementSummary, type SettlementTransaction } from '../lib/settleUp'
import type { Expense, ExpenseShare, GroupMember, Settlement } from '../lib/db.types'
import { Button, Card } from './ui'

export function BalanceSummary({
  currency,
  members,
  expenses,
  shares,
  settlements,
  onMarkSettled,
}: {
  currency: string
  members: GroupMember[]
  expenses: Expense[]
  shares: ExpenseShare[]
  settlements: Settlement[]
  onMarkSettled?: (tx: SettlementTransaction) => void
}) {
  const t = useT()
  const { language } = useLanguage()

  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.display_name])), [members])

  const transactions = useMemo(
    () =>
      getSettlementSummary({
        expenses: expenses.map((e) => ({ id: e.id, paid_by: e.paid_by, amount: Number(e.amount) })),
        shares: shares.map((s) => ({
          expense_id: s.expense_id,
          member_id: s.member_id,
          share_amount: Number(s.share_amount),
        })),
        settlements: settlements.map((s) => ({
          from_member: s.from_member,
          to_member: s.to_member,
          amount: Number(s.amount),
        })),
      }),
    [expenses, shares, settlements],
  )

  if (transactions.length === 0) {
    return (
      <Card className="flex items-center gap-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <span className="text-2xl">✓</span>
        <p className="font-medium">{t.dashboard.allSettledUp}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <Card key={`${tx.from}-${tx.to}`} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {format(t.dashboard.oneOnOne, {
                from: nameById.get(tx.from) ?? '?',
                to: nameById.get(tx.to) ?? '?',
              })}
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              {formatCurrency(tx.amount, currency, language)}
            </p>
          </div>
          {onMarkSettled && (
            <Button variant="secondary" onClick={() => onMarkSettled(tx)} className="shrink-0">
              {t.dashboard.markSettled}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}
