import { Outlet, useParams } from 'react-router-dom'
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
  return (
    <div className="flex flex-1 flex-col">
      <Outlet />
      <BottomNav groupId={groupId} />
    </div>
  )
}
