import { format, useT, useLanguage } from '../i18n'
import { formatCurrency } from '../lib/currency'
import type { SplitType } from '../lib/db.types'
import type { GroupMember } from '../lib/db.types'
import type { SplitResult } from '../lib/splitCalc'
import { Avatar } from './Avatar'
import { LabelRow, TextInput } from './ui'

export function SplitSelector({
  mode,
  onModeChange,
  members,
  currency,
  selectedIds,
  onToggleSelected,
  customValues,
  onCustomValueChange,
  result,
}: {
  mode: SplitType
  onModeChange: (mode: SplitType) => void
  members: GroupMember[]
  currency: string
  selectedIds: Set<string>
  onToggleSelected: (id: string) => void
  customValues: Record<string, string>
  onCustomValueChange: (id: string, value: string) => void
  result: SplitResult
}) {
  const t = useT()
  const { language } = useLanguage()

  const modes: { value: SplitType; label: string }[] = [
    { value: 'equal', label: t.expense.splitEqual },
    { value: 'custom_amount', label: t.expense.splitAmount },
    { value: 'custom_percent', label: t.expense.splitPercent },
  ]

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {modes.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onModeChange(m.value)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              mode === m.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3">
            {mode === 'equal' ? (
              <LabelRow>
                <input
                  type="checkbox"
                  checked={selectedIds.has(member.id)}
                  onChange={() => onToggleSelected(member.id)}
                  className="h-4 w-4"
                />
                <Avatar seed={member.id} kind="member" size="sm" />
                {member.display_name}
              </LabelRow>
            ) : (
              <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Avatar seed={member.id} kind="member" size="sm" />
                {member.display_name}
              </span>
            )}

            {mode === 'equal' ? (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedIds.has(member.id) && result.shares[member.id] !== undefined
                  ? formatCurrency(result.shares[member.id], currency, language)
                  : '—'}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={mode === 'custom_percent' ? '1' : '0.01'}
                  value={customValues[member.id] ?? ''}
                  onChange={(e) => onCustomValueChange(member.id, e.target.value)}
                  className="w-24 text-right"
                  placeholder="0"
                />
                <span className="w-4 text-xs text-slate-400">{mode === 'custom_percent' ? '%' : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {!result.isValid && Object.keys(customValues).length > 0 && mode !== 'equal' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {result.remainder > 0
            ? format(t.expense.shareRemaining, {
                amount: mode === 'custom_percent' ? `${result.remainder}%` : formatCurrency(result.remainder, currency, language),
              })
            : format(t.expense.shareOverAssigned, {
                amount: mode === 'custom_percent' ? `${-result.remainder}%` : formatCurrency(-result.remainder, currency, language),
              })}
        </p>
      )}
      {mode === 'equal' && selectedIds.size === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{t.expense.selectAtLeastOne}</p>
      )}
    </div>
  )
}
