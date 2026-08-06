import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format, useT, useLanguage } from '../i18n'
import { formatCurrency } from '../lib/currency'
import { createSettlement } from '../lib/settlements'
import { getErrorMessage } from '../lib/errors'
import type { SettlementTransaction } from '../lib/settleUp'
import { Button, ErrorText, Field, TextInput } from './ui'

export function SettleModal({
  groupId,
  currency,
  tx,
  nameById,
  onClose,
}: {
  groupId: string
  currency: string
  tx: SettlementTransaction
  nameById: Map<string, string>
  onClose: () => void
}) {
  const t = useT()
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(tx.amount.toFixed(2))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return
    setSubmitting(true)
    setError(null)
    try {
      await createSettlement({
        groupId,
        fromMember: tx.from,
        toMember: tx.to,
        amount: numericAmount,
        note: note.trim() || null,
      })
      await queryClient.invalidateQueries({ queryKey: ['ledger', groupId] })
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.settlement.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {format(t.dashboard.oneOnOne, { from: nameById.get(tx.from) ?? '?', to: nameById.get(tx.to) ?? '?' })}
          </p>
        </div>

        <Field label={t.settlement.amountLabel}>
          <TextInput
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label={t.settlement.note}>
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.settlement.notePlaceholder} />
        </Field>

        <p className="text-xs text-slate-400">{t.settlement.recorded}</p>
        <ErrorText>{error}</ErrorText>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={submitting || !Number(amount)}>
            {submitting ? t.settlement.confirming : `${t.settlement.confirm} · ${formatCurrency(Number(amount) || 0, currency, language)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
