import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function Header({ title, onBack, right }: { title: string; onBack?: boolean; right?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      {onBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-slate-600 dark:text-slate-300"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
      {right}
    </header>
  )
}
