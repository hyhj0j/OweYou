import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage, useT, type Language } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { useLedger } from '../hooks/useLedger'
import { categoryLabel, createCategory, deleteCategory } from '../lib/categories'
import { deleteGroup } from '../lib/groups'
import { getErrorMessage } from '../lib/errors'
import { Header } from '../components/Header'
import { Avatar } from '../components/Avatar'
import { DeleteGroupModal } from '../components/DeleteGroupModal'
import { Button, Card, ErrorText, Select, Spinner, TextInput } from '../components/ui'

export default function Settings() {
  const t = useT()
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguage()
  const { userId, userEmail, signOut } = useAuth()
  const queryClient = useQueryClient()
  const { groupId = '' } = useParams()
  const { data: group } = useGroup(groupId)
  const { data: ledger, isLoading } = useLedger(groupId)
  const [newCategory, setNewCategory] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const usedCategoryIds = new Set((ledger?.expenses ?? []).map((e) => e.category_id).filter(Boolean))

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAdding(true)
    setError(null)
    try {
      await createCategory(groupId, newCategory)
      setNewCategory('')
      await queryClient.invalidateQueries({ queryKey: ['ledger', groupId] })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    setError(null)
    try {
      await deleteCategory(id)
      await queryClient.invalidateQueries({ queryKey: ['ledger', groupId] })
    } catch {
      setError(t.settings.categoryInUse)
    }
  }

  async function handleDeleteGroup() {
    await deleteGroup(groupId)
    await queryClient.invalidateQueries({ queryKey: ['my-groups', userId] })
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t.settings.title} onBack />
      <div className="flex-1 space-y-6 px-5 py-6 pb-24">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.settings.language}</h2>
          <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="ko">한국어</option>
          </Select>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.settings.categories}</h2>
          {isLoading || !ledger ? (
            <div className="flex justify-center py-6 text-slate-400">
              <Spinner className="h-5 w-5" />
            </div>
          ) : (
            <ul className="space-y-2">
              {ledger.categories.map((c) => (
                <li key={c.id}>
                  <Card className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-800 dark:text-slate-200">{categoryLabel(c, t)}</span>
                    {!usedCategoryIds.has(c.id) && (
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-xs font-medium text-red-500"
                      >
                        {t.settings.deleteCategory}
                      </button>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddCategory} className="flex gap-2 pt-1">
            <TextInput
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t.settings.categoryNamePlaceholder}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" disabled={adding || !newCategory.trim()}>
              {t.settings.addCategory}
            </Button>
          </form>
          <ErrorText>{error}</ErrorText>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.auth.account}</h2>
          <Card className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              {userId && <Avatar seed={userId} kind="member" size="sm" />}
              <span className="truncate text-sm text-slate-800 dark:text-slate-200">{userEmail}</span>
            </div>
            <button onClick={() => signOut()} className="shrink-0 text-xs font-medium text-red-500">
              {t.auth.signOut}
            </button>
          </Card>
        </section>

        {group && group.created_by === userId && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-red-500">{t.settings.dangerZone}</h2>
            <Card className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-slate-800 dark:text-slate-200">{group.name}</span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 text-xs font-medium text-red-500"
              >
                {t.settings.deleteGroup}
              </button>
            </Card>
          </section>
        )}
      </div>

      {showDeleteModal && group && (
        <DeleteGroupModal
          groupName={group.name}
          onConfirm={handleDeleteGroup}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
