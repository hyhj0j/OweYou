import { format, useT, useLanguage } from '../i18n'
import { formatCurrency } from '../lib/currency'
import { categoryLabel } from '../lib/categories'
import type { Expense, ExpenseCategory, GroupMember } from '../lib/db.types'
import { Avatar } from './Avatar'
import { Card } from './ui'

export function ExpenseListItem({
  expense,
  currency,
  paidByMember,
  category,
}: {
  expense: Expense
  currency: string
  paidByMember: GroupMember | undefined
  category: ExpenseCategory | undefined
}) {
  const t = useT()
  const { language } = useLanguage()

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {paidByMember && <Avatar seed={paidByMember.id} kind="member" size="sm" />}
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{expense.description}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {format(t.history.paidByLine, {
              name: paidByMember?.display_name ?? '?',
              category: categoryLabel(category, t),
            })}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(Number(expense.amount), currency, language)}
        </p>
        <p className="text-xs text-slate-400">{expense.expense_date}</p>
      </div>
    </Card>
  )
}
