import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useGroup } from '../hooks/useGroup'
import { BottomNav } from './BottomNav'

/**
 * Shared shell for every /g/:groupId/* tab (Dashboard/History/Members/
 * Settings) so BottomNav is one persistent element across tab switches,
 * not a fresh instance per page -- remounting it on every navigation was
 * what made its height flicker on iOS (env(safe-area-inset-bottom)
 * recalculating on each fresh mount).
 */
export default function GroupLayout() {
  const { groupId = '' } = useParams()
  const { isError } = useGroup(groupId)

  // RLS hides a group's row once it's deleted (or if you were never a
  // member), so the fetch in useGroup() fails with "no rows" -- bounce back
  // to the group list instead of leaving every tab stuck on its spinner.
  if (isError) return <Navigate to="/" replace />

  return (
    <div className="flex flex-1 flex-col">
      <Outlet />
      <BottomNav groupId={groupId} />
    </div>
  )
}
