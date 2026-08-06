import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { createProfile } from '../lib/profile'
import { getErrorMessage } from '../lib/errors'
import { Button, ErrorText, Field, TextInput } from '../components/ui'

export default function Onboarding() {
  const t = useT()
  const queryClient = useQueryClient()
  const { userId, userEmail } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim() || !userId || !userEmail) return
    setSubmitting(true)
    setError(null)
    try {
      await createProfile(userId, userEmail, displayName)
      await queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t.onboarding.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.onboarding.subtitle}</p>
        </div>
        <Field label="">
          <TextInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t.onboarding.namePlaceholder}
            autoFocus
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" disabled={submitting || !displayName.trim()}>
          {submitting ? t.onboarding.submitting : t.onboarding.submit}
        </Button>
      </form>
    </div>
  )
}
