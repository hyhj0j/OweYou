import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useMyGroups } from '../hooks/useGroup'
import { Button, Card, TextInput, Spinner } from '../components/ui'
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
  const { loading: authLoading } = useAuth()
  const { data: groups, isLoading: groupsLoading } = useMyGroups()
  const [joinInput, setJoinInput] = useState('')

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = extractInviteCode(joinInput)
    if (code) navigate(`/join/${code}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t.home.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.home.subtitle}</p>
        </div>
        <LanguageToggle />
      </header>

      <div className="flex-1 space-y-6 px-5 py-6">
        <IosInstallHint />
        {authLoading || groupsLoading ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.home.yourGroups}</h2>
            {groups && groups.length > 0 ? (
              <ul className="space-y-2">
                {groups.map(({ group, member }) => (
                  <li key={group.id}>
                    <Card
                      className="flex cursor-pointer items-center gap-3 justify-between"
                      onClick={() => navigate(`/g/${group.id}`)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar seed={group.id} kind="group" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{group.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.display_name}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{group.currency}</span>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.noGroups}</p>
            )}
          </section>
        )}

        <Button className="w-full" onClick={() => navigate('/create')}>
          {t.home.createGroup}
        </Button>

        <form onSubmit={handleJoinSubmit} className="space-y-2">
          <TextInput
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            placeholder={t.home.joinGroupPlaceholder}
          />
          <Button type="submit" variant="secondary" className="w-full" disabled={!joinInput.trim()}>
            {t.home.joinGroup}
          </Button>
        </form>
      </div>
    </div>
  )
}
