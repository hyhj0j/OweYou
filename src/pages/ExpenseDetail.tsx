import { useNavigate, useParams } from 'react-router-dom'
import { format, useLanguage, useT } from '../i18n'
import { useGroup } from '../hooks/useGroup'
import { useLedger } from '../hooks/useLedger'
import { categoryLabel } from '../lib/categories'
import { formatCurrency } from '../lib/currency'
import { isExpenseLocked } from '../lib/expenseLock'
import { Header } from '../components/Header'
import { Avatar } from '../components/Avatar'
import { Button, Card, Spinner } from '../components/ui'

export default function ExpenseDetail() {
  const t = useT()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const { groupId = '', expenseId = '' } = useParams()
  const { data: group } = useGroup(groupId)
  const { data: ledger, isLoading } = useLedger(groupId)

  if (isLoading || !group || !ledger) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  const expense = ledger.expenses.find((e) => e.id === expenseId)
  if (!expense) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t.history.title} onBack />
        <div className="flex-1 px-5 py-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.common.somethingWentWrong}</p>
        </div>
      </div>
    )
  }

  const shares = ledger.shares.filter((s) => s.expense_id === expenseId)
  const memberById = new Map(ledger.members.map((m) => [m.id, m]))
  const category = expense.category_id ? ledger.categories.find((c) => c.id === expense.category_id) : undefined
  const paidByMember = memberById.get(expense.paid_by)
  const createdByMember = memberById.get(expense.created_by)
  const locked = isExpenseLocked(expense, ledger.shares, ledger.settlements)

  return (
    <div className="flex flex-1 flex-col">
      <Header title={expense.description} onBack />
      <div className="flex-1 space-y-6 px-5 py-6 pb-10">
        <div>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {formatCurrency(Number(expense.amount), group.currency, language)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {categoryLabel(category, t)} · {expense.expense_date}
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t.expense.paidBy}
          </h2>
          <Card className="flex items-center gap-3">
            {paidByMember && <Avatar seed={paidByMember.id} kind="member" size="sm" />}
            <span className="font-medium text-slate-900 dark:text-white">{paidByMember?.display_name ?? '?'}</span>
          </Card>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t.expense.participants}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            {shares.map((s, i) => {
              const m = memberById.get(s.member_id)
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${
                    i > 0 ? 'border-t border-slate-200 dark:border-slate-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar seed={s.member_id} kind="member" size="sm" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{m?.display_name ?? '?'}</span>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {formatCurrency(Number(s.share_amount), group.currency, language)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {expense.note && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t.expense.note}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">{expense.note}</p>
          </div>
        )}

        {createdByMember && createdByMember.id !== paidByMember?.id && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {format(t.history.loggedByLine, { name: createdByMember.display_name })}
          </p>
        )}

        <div className="pt-2">
          {locked ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t.expense.lockedNotice}</p>
          ) : (
            <Button className="w-full" onClick={() => navigate(`/g/${groupId}/expenses/${expenseId}/edit`)}>
              {t.common.edit}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
