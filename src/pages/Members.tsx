import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useGroup, useGroupMembers } from '../hooks/useGroup'
import { createPlaceholderMember, deletePlaceholderMember, inviteLinkFor } from '../lib/groups'
import { getErrorMessage } from '../lib/errors'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { Avatar } from '../components/Avatar'
import { Button, Card, ErrorText, Spinner, TextInput } from '../components/ui'

export default function Members() {
  const t = useT()
  const queryClient = useQueryClient()
  const { groupId = '' } = useParams()
  const { userId } = useAuth()
  const { data: group } = useGroup(groupId)
  const { data: members, isLoading } = useGroupMembers(groupId)
  const [copied, setCopied] = useState(false)
  const [placeholderName, setPlaceholderName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCopy() {
    if (!group) return
    await navigator.clipboard.writeText(inviteLinkFor(group.invite_code))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function invalidateMembers() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
      queryClient.invalidateQueries({ queryKey: ['ledger', groupId] }),
    ])
  }

  async function handleAddPlaceholder(e: React.FormEvent) {
    e.preventDefault()
    if (!placeholderName.trim()) return
    setAdding(true)
    setError(null)
    try {
      await createPlaceholderMember(groupId, placeholderName)
      setPlaceholderName('')
      await invalidateMembers()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  async function handleRemovePlaceholder(memberId: string) {
    setError(null)
    try {
      await deletePlaceholderMember(memberId)
      await invalidateMembers()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t.members.title} onBack />
      <div className="flex-1 space-y-6 px-5 py-6 pb-24">
        {isLoading || !group || !members ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            <section className="space-y-2">
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id}>
                    <Card className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar seed={m.id} kind="member" />
                        <span className="truncate font-medium text-slate-900 dark:text-white">{m.display_name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {m.user_id === userId && (
                          <span className="text-xs text-slate-400">{t.members.you}</span>
                        )}
                        {m.user_id === null && (
                          <>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              {t.members.pendingBadge}
                            </span>
                            <button
                              onClick={() => handleRemovePlaceholder(m.id)}
                              className="text-xs font-medium text-red-500"
                            >
                              {t.members.removePlaceholder}
                            </button>
                          </>
                        )}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>

              <p className="pt-2 text-xs text-slate-400">{t.members.addPlaceholder}</p>
              <form onSubmit={handleAddPlaceholder} className="flex gap-2">
                <TextInput
                  value={placeholderName}
                  onChange={(e) => setPlaceholderName(e.target.value)}
                  placeholder={t.members.placeholderNamePlaceholder}
                  className="flex-1"
                />
                <Button type="submit" variant="secondary" disabled={adding || !placeholderName.trim()}>
                  {t.members.addPlaceholderSubmit}
                </Button>
              </form>
              <ErrorText>{error}</ErrorText>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.members.inviteLink}</h2>
              <Card className="space-y-3">
                <p className="break-all text-sm text-slate-600 dark:text-slate-300">
                  {inviteLinkFor(group.invite_code)}
                </p>
                <p className="text-xs text-slate-400">{t.members.inviteHint}</p>
                <Button variant="secondary" onClick={handleCopy} className="w-full">
                  {copied ? t.common.copied : t.members.copyLink}
                </Button>
              </Card>
            </section>
          </>
        )}
      </div>
      <BottomNav groupId={groupId} />
    </div>
  )
}
