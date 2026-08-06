import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, ko, type Dictionary } from './translations'

export type Language = 'en' | 'ko'

const STORAGE_KEY = 'settle-up:lang'
const dictionaries: Record<Language, Dictionary> = { en, ko }

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'ko' ? 'ko' : 'en'
}

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: dictionaries[language],
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}

/** Shorthand for the translation dictionary of the current language. */
export function useT() {
  return useLanguage().t
}

/** Replaces `{name}` placeholders in a template string. */
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

/**
 * Templates with a "singular|plural" form (e.g. "{count} member|{count} members")
 * pick the right half based on count, then interpolate.
 */
export function plural(template: string, count: number, vars?: Record<string, string | number>) {
  const [singular, pluralForm] = template.split('|')
  const chosen = count === 1 ? singular : (pluralForm ?? singular)
  return format(chosen, { count, ...vars })
}
