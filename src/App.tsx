import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import GroupLayout from './components/GroupLayout'
import Home from './pages/Home'
import CreateGroup from './pages/CreateGroup'
import JoinGroup from './pages/JoinGroup'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ExpenseDetail from './pages/ExpenseDetail'
import Members from './pages/Members'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGroup />} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />
        <Route path="/g/:groupId" element={<GroupLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="history" element={<History />} />
          <Route path="members" element={<Members />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/g/:groupId/add" element={<AddExpense />} />
        <Route path="/g/:groupId/expenses/:expenseId" element={<ExpenseDetail />} />
        <Route path="/g/:groupId/expenses/:expenseId/edit" element={<AddExpense />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  )
}
