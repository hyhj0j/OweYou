import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { format, useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { createGroup } from '../lib/groups'
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../lib/currency'
import { getErrorMessage } from '../lib/errors'
import { Button, ErrorText, Field, Select, TextInput } from '../components/ui'
import { Header } from '../components/Header'

export default function CreateGroup() {
  const t = useT()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId } = useAuth()
  const { data: profile } = useProfile()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !profile) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await createGroup(name, currency, profile.display_name)
      await queryClient.invalidateQueries({ queryKey: ['my-groups', userId] })
      navigate(`/g/${result.group_id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t.createGroup.title} onBack />
      <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-5 py-6">
        <Field label={t.createGroup.nameLabel}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.createGroup.namePlaceholder}
            autoFocus
          />
        </Field>
        <Field label={t.createGroup.currencyLabel}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}>
            {CURRENCY_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </Field>
        {profile && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {format(t.createGroup.joiningAsLabel, { name: profile.display_name })}
          </p>
        )}
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" disabled={submitting || !name.trim() || !profile}>
          {submitting ? t.createGroup.submitting : t.createGroup.submit}
        </Button>
      </form>
    </div>
  )
}
