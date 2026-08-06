import { useState } from 'react'
import { useT } from '../i18n'
import { createPlaceholderMember } from '../lib/groups'
import { getErrorMessage } from '../lib/errors'
import type { GroupMember } from '../lib/db.types'
import { Button, ErrorText, TextInput } from './ui'

export function AddMemberInline({ groupId, onAdded }: { groupId: string; onAdded: (member: GroupMember) => void }) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const member = await createPlaceholderMember(groupId, name)
      onAdded(member)
      setName('')
      setExpanded(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
      >
        + {t.expense.addMemberToggle}
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.expense.addMemberPlaceholder}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" variant="secondary" disabled={submitting || !name.trim()}>
          {t.expense.addMemberSubmit}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setExpanded(false)}>
          {t.common.cancel}
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}
