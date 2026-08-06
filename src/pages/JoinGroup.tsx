import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, plural, useT } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { joinGroup, listUnclaimedMembers, previewGroupByCode } from '../lib/groups'
import { getErrorMessage } from '../lib/errors'
import { Button, Card, ErrorText, LabelRow, Spinner } from '../components/ui'
import { Header } from '../components/Header'

const NEW_MEMBER = 'new'

export default function JoinGroup() {
  const t = useT()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId } = useAuth()
  const { data: profile } = useProfile()
  const { inviteCode = '' } = useParams()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedClaim, setSelectedClaim] = useState(NEW_MEMBER)

  const preview = useQuery({
    queryKey: ['group-preview', inviteCode],
    queryFn: () => previewGroupByCode(inviteCode),
    enabled: !!inviteCode,
  })

  const unclaimed = useQuery({
    queryKey: ['unclaimed-members', inviteCode],
    queryFn: () => listUnclaimedMembers(inviteCode),
    enabled: !!inviteCode,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const claimId = selectedClaim === NEW_MEMBER ? undefined : selectedClaim
      const result = await joinGroup(inviteCode, profile.display_name, claimId)
      await queryClient.invalidateQueries({ queryKey: ['my-groups', userId] })
      navigate(`/g/${result.group_id}`, { replace: true })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  if (preview.isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t.common.loading} onBack />
        <div className="flex flex-1 items-center justify-center text-slate-400">
          <Spinner className="h-6 w-6" />
        </div>
      </div>
    )
  }

  if (preview.isError) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t.common.somethingWentWrong} onBack />
        <div className="flex-1 space-y-3 px-5 py-6">
          <ErrorText>{t.common.somethingWentWrong}</ErrorText>
          <Button variant="secondary" onClick={() => preview.refetch()}>
            {t.common.retry}
          </Button>
        </div>
      </div>
    )
  }

  if (!preview.data) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t.joinGroup.title.replace('{groupName}', '')} onBack />
        <div className="flex-1 px-5 py-6">
          <ErrorText>{t.joinGroup.invalidCode}</ErrorText>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={format(t.joinGroup.title, { groupName: preview.data.group_name })} onBack />
      <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-5 py-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {plural(t.joinGroup.memberCount, preview.data.member_count)}
        </p>
        {profile && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {format(t.joinGroup.joiningAsLabel, { name: profile.display_name })}
          </p>
        )}

        {unclaimed.data && unclaimed.data.length > 0 && (
          <Card className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.joinGroup.claimPrompt}</p>
            {unclaimed.data.map((m) => (
              <LabelRow key={m.member_id}>
                <input
                  type="radio"
                  name="claim-member"
                  value={m.member_id}
                  checked={selectedClaim === m.member_id}
                  onChange={(e) => setSelectedClaim(e.target.value)}
                />
                {m.display_name}
              </LabelRow>
            ))}
            <LabelRow>
              <input
                type="radio"
                name="claim-member"
                value={NEW_MEMBER}
                checked={selectedClaim === NEW_MEMBER}
                onChange={(e) => setSelectedClaim(e.target.value)}
              />
              {t.joinGroup.claimNoneOption}
            </LabelRow>
          </Card>
        )}

        <ErrorText>{submitError}</ErrorText>
        <Button type="submit" className="w-full" disabled={submitting || !profile}>
          {submitting ? t.joinGroup.submitting : t.joinGroup.submit}
        </Button>
      </form>
    </div>
  )
}
