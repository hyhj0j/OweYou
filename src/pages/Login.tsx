import { useState } from 'react'
import { useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { LanguageToggle } from '../components/LanguageToggle'
import { Button, ErrorText } from '../components/ui'

export default function Login() {
  const t = useT()
  const { signInWithGoogle, error } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  async function handleClick() {
    setSubmitting(true)
    await signInWithGoogle()
    setSubmitting(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end px-5 pt-6">
        <LanguageToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t.auth.signInTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.auth.signInSubtitle}</p>
        </div>
        <Button className="w-full" onClick={handleClick} disabled={submitting}>
          {submitting ? t.auth.signingIn : t.auth.signInWithGoogle}
        </Button>
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  )
}
