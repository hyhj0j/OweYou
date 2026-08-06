import { useLanguage, type Language } from '../i18n'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  function toggle() {
    const next: Language = language === 'en' ? 'ko' : 'en'
    setLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
    >
      {language === 'en' ? 'EN' : '한국어'}
    </button>
  )
}
