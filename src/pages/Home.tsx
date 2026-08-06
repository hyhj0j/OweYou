import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useMyGroups } from '../hooks/useGroup'
import { Button, TextInput, Spinner } from '../components/ui'
import { LanguageToggle } from '../components/LanguageToggle'
import { IosInstallHint } from '../components/IosInstallHint'
import { Avatar } from '../components/Avatar'

function extractInviteCode(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/\/join\/([a-zA-Z0-9]+)/)
  return match ? match[1] : trimmed
}

export default function Home() {
  const t = useT()
  const navigate = useNavigate()
  const { loading: authLoading, signOut } = useAuth()
  const { data: groups, isLoading: groupsLoading } = useMyGroups()
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinInput, setJoinInput] = useState('')

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = extractInviteCode(joinInput)
    if (code) navigate(`/join/${code}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="flex items-start justify-between gap-3 px-5 pb-[39px]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.75rem)' }}
      >
        <div>
          <h1 className="font-nippo text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
            {t.home.title}
          </h1>
          <p className="font-nippo mt-1 text-xs text-slate-500 dark:text-slate-400">{t.home.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageToggle />
          <button
            onClick={() => signOut()}
            aria-label={t.auth.signOut}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-8 px-5 pb-8">
        <IosInstallHint />

        {authLoading || groupsLoading ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t.home.yourGroups}
            </h2>
            {groups && groups.length > 0 ? (
              <ul className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                {groups.map(({ group, member }, i) => (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/g/${group.id}`)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-900 dark:active:bg-slate-800 ${
                        i > 0 ? 'border-t border-slate-200 dark:border-slate-800' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar seed={group.id} kind="group" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{group.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {member.display_name} · {group.currency}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.noGroups}</p>
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <Button className="w-full" onClick={() => navigate('/create')}>
            {t.home.createGroup}
          </Button>

          {joinOpen ? (
            <form onSubmit={handleJoinSubmit} className="space-y-2">
              <TextInput
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder={t.home.joinGroupPlaceholder}
                autoFocus
              />
              <Button type="submit" variant="secondary" className="w-full" disabled={!joinInput.trim()}>
                {t.home.joinGroupSubmit}
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="w-full py-1 text-center text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t.home.joinGroup}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
