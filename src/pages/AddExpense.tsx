import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useT } from '../i18n'
import { useGroup } from '../hooks/useGroup'
import { useLedger } from '../hooks/useLedger'
import { useMyMember } from '../hooks/useMyMember'
import { createExpense, updateExpense } from '../lib/expenses'
import { computeSplit } from '../lib/splitCalc'
import { categoryLabel } from '../lib/categories'
import { getErrorMessage } from '../lib/errors'
import type { GroupMember, SplitType } from '../lib/db.types'
import type { Ledger } from '../lib/ledger'
import { Header } from '../components/Header'
import { SplitSelector } from '../components/SplitSelector'
import { AddMemberInline } from '../components/AddMemberInline'
import { Button, ErrorText, Field, Select, Spinner, TextInput } from '../components/ui'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function AddExpense() {
  const t = useT()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { groupId = '', expenseId } = useParams()
  const isEditing = !!expenseId
  const { data: group } = useGroup(groupId)
  const { data: ledger, isLoading } = useLedger(groupId)
  const myMember = useMyMember(groupId)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [date, setDate] = useState(today())
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editInitialized, setEditInitialized] = useState(false)

  useEffect(() => {
    if (isEditing || !ledger) return
    if (!paidBy && myMember) setPaidBy(myMember.id)
    if (!categoryId && ledger.categories.length > 0) setCategoryId(ledger.categories[0].id)
    if (selectedIds.size === 0 && ledger.members.length > 0) {
      setSelectedIds(new Set(ledger.members.map((m) => m.id)))
    }
  }, [isEditing, ledger, myMember, paidBy, categoryId, selectedIds.size])

  // Prefill the form from the existing expense once, the first time its
  // data shows up in the already-loaded ledger (no separate fetch needed).
  useEffect(() => {
    if (!isEditing || editInitialized || !ledger) return
    const expense = ledger.expenses.find((e) => e.id === expenseId)
    if (!expense) return
    const shares = ledger.shares.filter((s) => s.expense_id === expenseId)

    setDescription(expense.description)
    setAmount(expense.amount)
    setCategoryId(expense.category_id ?? '')
    setPaidBy(expense.paid_by)
    setDate(expense.expense_date)
    setSplitType(expense.split_type)
    setSelectedIds(new Set(shares.map((s) => s.member_id)))
    if (expense.split_type === 'custom_amount') {
      setCustomValues(Object.fromEntries(shares.map((s) => [s.member_id, s.share_amount])))
    } else if (expense.split_type === 'custom_percent') {
      const totalAmount = Number(expense.amount) || 0
      setCustomValues(
        Object.fromEntries(
          shares.map((s) => [
            s.member_id,
            totalAmount > 0 ? String(Math.round((Number(s.share_amount) / totalAmount) * 10000) / 100) : '0',
          ]),
        ),
      )
    }
    setEditInitialized(true)
  }, [isEditing, editInitialized, ledger, expenseId])

  const numericAmount = Number(amount) || 0

  const split = useMemo(
    () => computeSplit(splitType, numericAmount, [...selectedIds], customValues),
    [splitType, numericAmount, selectedIds, customValues],
  )

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCustomValueChange(id: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [id]: value }))
  }

  function handleModeChange(mode: SplitType) {
    setSplitType(mode)
    setCustomValues({})
  }

  function handleMemberAdded(member: GroupMember) {
    queryClient.setQueryData<Ledger>(['ledger', groupId], (old) =>
      old ? { ...old, members: [...old.members, member] } : old,
    )
    setSelectedIds((prev) => new Set(prev).add(member.id))
  }

  const canSubmit = description.trim() && numericAmount > 0 && paidBy && split.isValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const shares = Object.entries(split.shares).map(([member_id, share_amount]) => ({ member_id, share_amount }))
      if (isEditing) {
        await updateExpense({
          expenseId: expenseId!,
          description,
          amount: numericAmount,
          categoryId: categoryId || null,
          paidBy,
          expenseDate: date,
          splitType,
          shares,
        })
      } else {
        await createExpense({
          groupId,
          description,
          amount: numericAmount,
          categoryId: categoryId || null,
          paidBy,
          expenseDate: date,
          splitType,
          shares,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['ledger', groupId] })
      navigate(`/g/${groupId}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  if (isLoading || !group || !ledger || (isEditing && !editInitialized)) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={isEditing ? t.expense.editTitle : t.expense.title} onBack />
      <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-5 py-6">
        <Field label={t.expense.description}>
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.expense.descriptionPlaceholder}
            autoFocus
          />
        </Field>

        <Field label={t.expense.amount}>
          <TextInput
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.expense.category}>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {ledger.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c, t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.expense.date}>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label={t.expense.paidBy}>
          <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {ledger.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </Select>
        </Field>

        <AddMemberInline groupId={groupId} onAdded={handleMemberAdded} />

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.expense.participants}</span>
          <SplitSelector
            mode={splitType}
            onModeChange={handleModeChange}
            members={ledger.members}
            currency={group.currency}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            customValues={customValues}
            onCustomValueChange={handleCustomValueChange}
            result={split}
          />
        </div>

        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isEditing
            ? submitting
              ? t.expense.saving
              : t.expense.saveChanges
            : submitting
              ? t.expense.submitting
              : t.expense.submit}
        </Button>
      </form>
    </div>
  )
}
