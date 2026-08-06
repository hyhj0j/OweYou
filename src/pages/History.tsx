import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useT } from '../i18n'
import { useGroup } from '../hooks/useGroup'
import { useLedger } from '../hooks/useLedger'
import { categoryLabel } from '../lib/categories'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { ExpenseListItem } from '../components/ExpenseListItem'
import { Select, Spinner } from '../components/ui'

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export default function History() {
  const t = useT()
  const { groupId = '' } = useParams()
  const { data: group } = useGroup(groupId)
  const { data: ledger, isLoading } = useLedger(groupId)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'month'>('all')

  const memberById = useMemo(() => new Map((ledger?.members ?? []).map((m) => [m.id, m])), [ledger])
  const categoryById = useMemo(() => new Map((ledger?.categories ?? []).map((c) => [c.id, c])), [ledger])

  const filtered = useMemo(() => {
    if (!ledger) return []
    return ledger.expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category_id !== categoryFilter) return false
      if (dateFilter === 'month' && !isThisMonth(e.expense_date)) return false
      return true
    })
  }, [ledger, categoryFilter, dateFilter])

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t.history.title} onBack />
      <div className="flex-1 space-y-4 px-5 py-6 pb-24">
        {isLoading || !group || !ledger ? (
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

            {filtered.length === 0 ? (
              <p className="pt-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.history.noResults}</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((expense) => (
                  <Link key={expense.id} to={`/g/${groupId}/expenses/${expense.id}/edit`} className="block">
                    <ExpenseListItem
                      expense={expense}
                      currency={group.currency}
                      paidByMember={memberById.get(expense.paid_by)}
                      category={expense.category_id ? categoryById.get(expense.category_id) : undefined}
                    />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav groupId={groupId} />
    </div>
  )
}
