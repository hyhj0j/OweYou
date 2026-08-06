import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'

const icons = {
  groups: (
    <path
      d="M9 11a3 3 0 100-6 3 3 0 000 6zM3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1M17 11a3 3 0 100-6M21 20v-1a5 5 0 00-3.5-4.77"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  dashboard: (
    <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
  ),
  history: (
    <path
      d="M12 8v4l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  members: (
    <path
      d="M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 10a3 3 0 100-6 3 3 0 000 6zM22 19v-1a4 4 0 00-3-3.87M16 4.13a4 4 0 010 7.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  settings: (
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

export function BottomNav({ groupId }: { groupId: string }) {
  const t = useT()
  const tabs: { to: string; label: string; icon: keyof typeof icons; end?: boolean }[] = [
    { to: '/', label: t.nav.groups, icon: 'groups', end: true },
    { to: `/g/${groupId}`, label: t.nav.dashboard, icon: 'dashboard', end: true },
    { to: `/g/${groupId}/history`, label: t.nav.history, icon: 'history' },
    { to: `/g/${groupId}/members`, label: t.nav.members, icon: 'members' },
    { to: `/g/${groupId}/settings`, label: t.nav.settings, icon: 'settings' },
  ]

  return (
    <nav
      className="sticky bottom-0 z-10 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${
              isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
            }`
          }
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {icons[tab.icon]}
          </svg>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
