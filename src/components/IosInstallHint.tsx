import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { Card } from './ui'

const DISMISSED_KEY = 'ios-install-hint-dismissed'

function isIos(): boolean {
  const ua = navigator.userAgent
  // iPadOS 13+ reports as "Macintosh" in the UA string but, unlike a real
  // Mac, exposes touch points -- that's the standard way to tell them apart.
  return /iPhone|iPad|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))
}

function isStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function IosInstallHint() {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (isStandalone()) return
    if (!isIos()) return
    setVisible(true)
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{t.home.iosInstallTitle}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.home.iosInstallBody}</p>
      </div>
      <button
        onClick={dismiss}
        aria-label={t.home.iosInstallDismiss}
        className="shrink-0 text-slate-400 dark:text-slate-500"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </Card>
  )
}
