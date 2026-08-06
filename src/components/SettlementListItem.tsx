import { format, useT, useLanguage } from '../i18n'
import { formatCurrency } from '../lib/currency'
import type { GroupMember, Settlement } from '../lib/db.types'
import { Card } from './ui'

export function SettlementListItem({
  settlement,
  currency,
  fromMember,
  toMember,
  createdByMember,
}: {
  settlement: Settlement
  currency: string
  fromMember: GroupMember | undefined
  toMember: GroupMember | undefined
  createdByMember?: GroupMember
}) {
  const t = useT()
  const { language } = useLanguage()
  const showLoggedBy =
    createdByMember && createdByMember.id !== fromMember?.id && createdByMember.id !== toMember?.id

  return (
    <Card className="flex items-center justify-between gap-3 bg-emerald-50/60 dark:bg-emerald-950/20">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          ✓
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">
            {format(t.history.settledLine, {
              from: fromMember?.display_name ?? '?',
              to: toMember?.display_name ?? '?',
            })}
          </p>
          {settlement.note && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{settlement.note}</p>
          )}
          {showLoggedBy && (
            <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
              {format(t.history.loggedByLine, { name: createdByMember.display_name })}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(Number(settlement.amount), currency, language)}
        </p>
        <p className="text-xs text-slate-400">{settlement.settled_at.slice(0, 10)}</p>
      </div>
    </Card>
  )
}
