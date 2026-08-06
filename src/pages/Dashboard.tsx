import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT } from '../i18n'
import { useGroup } from '../hooks/useGroup'
import { useLedger } from '../hooks/useLedger'
import { useMyMember } from '../hooks/useMyMember'
import { useRealtimeGroup } from '../hooks/useRealtimeGroup'
import { BalanceSummary } from '../components/BalanceSummary'
import { ExpenseListItem } from '../components/ExpenseListItem'
import { SettleModal } from '../components/SettleModal'
import { BottomNav } from '../components/BottomNav'
import { Button, Spinner } from '../components/ui'
import type { SettlementTransaction } from '../lib/settleUp'

export default function Dashboard() {
  const t = useT()
  const navigate = useNavigate()
  const { groupId = '' } = useParams()
  const { data: group } = useGroup(groupId)
  const { data: ledger, isLoading } = useLedger(groupId)
  const myMember = useMyMember(groupId)
  const [settlingTx, setSettlingTx] = useState<SettlementTransaction | null>(null)

  useRealtimeGroup(groupId)

  const nameById = useMemo(() => new Map((ledger?.members ?? []).map((m) => [m.id, m.display_name])), [ledger])
  const categoryById = useMemo(() => new Map((ledger?.categories ?? []).map((c) => [c.id, c])), [ledger])
  const memberById = useMemo(() => new Map((ledger?.members ?? []).map((m) => [m.id, m])), [ledger])

  if (isLoading || !group || !ledger) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  const recentExpenses = ledger.expenses.slice(0, 5)

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{group.name}</h1>
      </header>

      <div className="flex-1 space-y-6 px-5 pb-24">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.dashboard.balancesTitle}</h2>
          <BalanceSummary
            currency={group.currency}
            members={ledger.members}
            expenses={ledger.expenses}
            shares={ledger.shares}
            settlements={ledger.settlements}
            onMarkSettled={setSettlingTx}
          />
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.dashboard.recentExpenses}</h2>
            {ledger.expenses.length > 0 && (
              <Link to={`/g/${groupId}/history`} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dashboard.viewAll}
              </Link>
            )}
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.dashboard.noExpenses}</p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => (
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
        </section>
      </div>

      <div
        className="pointer-events-none sticky z-10 flex justify-end px-5 pb-3"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        <Button
          className="pointer-events-auto shadow-lg"
          onClick={() => navigate(`/g/${groupId}/add`)}
        >
          + {t.dashboard.addExpense}
        </Button>
      </div>

      <BottomNav groupId={groupId} />

      {settlingTx && myMember && (
        <SettleModal
          groupId={groupId}
          currency={group.currency}
          tx={settlingTx}
          nameById={nameById}
          onClose={() => setSettlingTx(null)}
        />
      )}
    </div>
  )
}
