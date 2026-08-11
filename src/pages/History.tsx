import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format, useLanguage, useT } from '../i18n'
import { useGroup } from '../hooks/useGroup'
import { useLedger } from '../hooks/useLedger'
import { useDeletedExpenses } from '../hooks/useDeletedExpenses'
import { categoryLabel } from '../lib/categories'
import type { Expense, Settlement } from '../lib/db.types'
import { Header } from '../components/Header'
import { ExpenseListItem } from '../components/ExpenseListItem'
import { SettlementListItem } from '../components/SettlementListItem'
import { Select, Spinner } from '../components/ui'

type HistoryItem =
  | { type: 'expense'; date: string; expense: Expense }
  | { type: 'settlement'; date: string; settlement: Settlement }

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export default function History() {
  const t = useT()
  const { language } = useLanguage()
  const { groupId = '' } = useParams()
  const { data: group } = useGroup(groupId)
  const { data: ledger, isLoading } = useLedger(groupId)
  const [tab, setTab] = useState<'active' | 'deleted'>('active')
  const { data: deletedExpenses, isLoading: isLoadingDeleted } = useDeletedExpenses(tab === 'deleted' ? groupId : undefined)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'month'>('all')

  const memberById = useMemo(() => new Map((ledger?.members ?? []).map((m) => [m.id, m])), [ledger])
  const categoryById = useMemo(() => new Map((ledger?.categories ?? []).map((c) => [c.id, c])), [ledger])

  const items = useMemo((): HistoryItem[] => {
    if (!ledger) return []

    const expenseItems: HistoryItem[] = ledger.expenses
      .filter((e) => {
        if (categoryFilter !== 'all' && e.category_id !== categoryFilter) return false
        if (dateFilter === 'month' && !isThisMonth(e.expense_date)) return false
        return true
      })
      .map((expense) => ({ type: 'expense', date: expense.expense_date, expense }))

    // Settlements have no category, so a specific category filter excludes them.
    const settlementItems: HistoryItem[] =
      categoryFilter !== 'all'
        ? []
        : ledger.settlements
            .filter((s) => dateFilter !== 'month' || isThisMonth(s.settled_at))
            .map((settlement) => ({ type: 'settlement', date: settlement.settled_at, settlement }))

    return [...expenseItems, ...settlementItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [ledger, categoryFilter, dateFilter])

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t.history.title} onBack />
      <div className="flex-1 space-y-4 px-5 py-6 pb-24">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab('active')}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === 'active'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t.history.tabActive}
          </button>
          <button
            onClick={() => setTab('deleted')}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === 'deleted'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t.history.tabDeleted}
          </button>
        </div>

        {tab === 'active' ? (
          isLoading || !group || !ledger ? (
            <div className="flex justify-center py-10 text-slate-400">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">{t.history.filterAllCategories}</option>
                  {ledger.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {categoryLabel(c, t)}
                    </option>
                  ))}
                </Select>
                <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as 'all' | 'month')}>
                  <option value="all">{t.history.filterAllTime}</option>
                  <option value="month">{t.history.filterThisMonth}</option>
                </Select>
              </div>

              {items.length === 0 ? (
                <p className="pt-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.history.noResults}</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) =>
                    item.type === 'expense' ? (
                      <Link
                        key={`expense-${item.expense.id}`}
                        to={`/g/${groupId}/expenses/${item.expense.id}`}
                        className="block"
                      >
                        <ExpenseListItem
                          expense={item.expense}
                          currency={group.currency}
                          paidByMember={memberById.get(item.expense.paid_by)}
                          category={item.expense.category_id ? categoryById.get(item.expense.category_id) : undefined}
                          createdByMember={memberById.get(item.expense.created_by)}
                        />
                      </Link>
                    ) : (
                      <SettlementListItem
                        key={`settlement-${item.settlement.id}`}
                        settlement={item.settlement}
                        currency={group.currency}
                        fromMember={memberById.get(item.settlement.from_member)}
                        toMember={memberById.get(item.settlement.to_member)}
                        createdByMember={memberById.get(item.settlement.created_by)}
                      />
                    ),
                  )}
                </div>
              )}
            </>
          )
        ) : isLoadingDeleted || !group ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !deletedExpenses || deletedExpenses.length === 0 ? (
          <p className="pt-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.history.deletedNoResults}</p>
        ) : (
          <div className="space-y-2">
            {deletedExpenses.map((expense) => {
              const deletedByMember = expense.deleted_by ? memberById.get(expense.deleted_by) : undefined
              return (
                <div key={expense.id} className="opacity-70">
                  <ExpenseListItem
                    expense={expense}
                    currency={group.currency}
                    paidByMember={memberById.get(expense.paid_by)}
                    category={expense.category_id ? categoryById.get(expense.category_id) : undefined}
                  />
                  {expense.deleted_at && (
                    <p className="mt-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {format(t.history.deletedByLine, {
                        name: deletedByMember?.display_name ?? '?',
                        date: new Date(expense.deleted_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-CA'),
                      })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
