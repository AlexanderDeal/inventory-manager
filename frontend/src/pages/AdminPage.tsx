import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface User {
  id: number
  username: string
  email: string
  role: string
  department: string | null
  is_active: boolean
  balance: number
}

interface Loan {
  id: number
  user_id: number
  item_id: number
  status: string
  loaned_at: string
  due_date: string | null
  returned_at: string | null
}

export default function AdminPage() {
  const { logout, username, role } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [itemMap, setItemMap] = useState<Record<number, string>>({})
  const [userMap, setUserMap] = useState<Record<number, string>>({})
  const [activeTab, setActiveTab] = useState<'users' | 'loans'>('users')
  const [editingBalance, setEditingBalance] = useState<Record<number, string>>({})

  useEffect(() => {
    Promise.all([
      api.get('/users/'),
      api.get('/loans/'),
      api.get('/items/'),
    ]).then(([usersRes, loansRes, itemsRes]) => {
      setUsers(usersRes.data)
      setLoans(loansRes.data)
      const iMap: Record<number, string> = {}
      itemsRes.data.forEach((item: { id: number; name: string }) => { iMap[item.id] = item.name })
      setItemMap(iMap)
      const uMap: Record<number, string> = {}
      usersRes.data.forEach((user: User) => { uMap[user.id] = user.username })
      setUserMap(uMap)
    })
  }, [])

  async function updateRole(userId: number, role: string) {
    await api.patch(`/users/${userId}/role`, { role })
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
  }

  async function toggleActive(userId: number, is_active: boolean) {
    await api.patch(`/users/${userId}/active`, { is_active })
    setUsers(users.map(u => u.id === userId ? { ...u, is_active } : u))
  }

  async function saveBalance(userId: number) {
    const raw = editingBalance[userId]
    const parsed = parseFloat(raw)
    if (isNaN(parsed) || parsed < 0) return
    await api.patch(`/users/${userId}/balance`, { balance: parsed })
    setUsers(users.map(u => u.id === userId ? { ...u, balance: parsed } : u))
    setEditingBalance(prev => { const next = { ...prev }; delete next[userId]; return next })
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Inventory Manager</h1>
          <button
            onClick={() => navigate('/inventory')}
            className="text-sm text-blue-600 hover:underline"
          >
            Inventory
          </button>
          <span className="text-sm font-medium text-purple-600">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {username && (
            <span className="text-sm text-gray-500">
              {username} <span className="capitalize text-gray-400">({role})</span>
            </span>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-500">
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded font-medium text-sm ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded font-medium text-sm ${activeTab === 'loans' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Loans ({loans.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Username</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Balance</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.department || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={e => updateRole(user.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {editingBalance[user.id] !== undefined ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingBalance[user.id]}
                            onChange={e => setEditingBalance(prev => ({ ...prev, [user.id]: e.target.value }))}
                            className="w-20 border border-gray-300 rounded px-2 py-0.5 text-sm"
                          />
                          <button onClick={() => saveBalance(user.id)} className="text-xs text-green-600 hover:underline">Save</button>
                          <button onClick={() => setEditingBalance(prev => { const n = { ...prev }; delete n[user.id]; return n })} className="text-xs text-gray-400 hover:underline">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingBalance(prev => ({ ...prev, [user.id]: user.balance.toFixed(2) }))}
                          className="text-sm text-gray-700 hover:text-blue-600"
                        >
                          ${user.balance.toFixed(2)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(user.id, !user.is_active)}
                        className={`text-xs px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Loan ID</th>
                  <th className="px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Loaned At</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Returned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">#{loan.id}</td>
                    <td className="px-4 py-3">{userMap[loan.user_id] || `#${loan.user_id}`}</td>
                    <td className="px-4 py-3">{itemMap[loan.item_id] || `#${loan.item_id}`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${loan.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(loan.loaned_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {loan.returned_at ? new Date(loan.returned_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
