import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import Home from './pages/Home'
import CreateGroup from './pages/CreateGroup'
import JoinGroup from './pages/JoinGroup'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
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
        <Route path="/g/:groupId" element={<Dashboard />} />
        <Route path="/g/:groupId/add" element={<AddExpense />} />
        <Route path="/g/:groupId/expenses/:expenseId/edit" element={<AddExpense />} />
        <Route path="/g/:groupId/history" element={<History />} />
        <Route path="/g/:groupId/members" element={<Members />} />
        <Route path="/g/:groupId/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  )
}
