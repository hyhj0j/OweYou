import { useState } from 'react'
import { format, useT } from '../i18n'
import { getErrorMessage } from '../lib/errors'
import { Button, ErrorText } from './ui'

export function DeleteExpenseModal({
  description,
  onConfirm,
  onClose,
}: {
  description: string
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const t = useT()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.expense.deleteConfirmTitle}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {format(t.expense.deleteConfirmBody, { description })}
          </p>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirm} disabled={submitting}>
            {submitting ? t.expense.deleting : t.common.delete}
          </Button>
        </div>
      </div>
    </div>
  )
}
