import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'

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

interface Transaction {
  id: number
  user_id: number
  item_id: number
  transaction_type: string
  quantity: number
  total_price: number | null
  created_at: string
}

interface Item {
  id: number
  name: string
  item_type: string
  quantity: number
  available: number
}

type Tab = 'users' | 'loans' | 'analytics'

const ROLES = ['student', 'staff', 'manager', 'admin']
const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-500',
  staff: 'bg-green-500',
  manager: 'bg-orange-500',
  admin: 'bg-purple-500',
}
const TYPE_COLORS: Record<string, string> = {
  loanable: 'bg-blue-500',
  rentable: 'bg-purple-500',
  purchasable: 'bg-green-500',
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [itemMap, setItemMap] = useState<Record<number, string>>({})
  const [userMap, setUserMap] = useState<Record<number, string>>({})
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [editingBalance, setEditingBalance] = useState<Record<number, string>>({})

  useEffect(() => {
    Promise.all([
      api.get('/users/'),
      api.get('/loans/'),
      api.get('/items/'),
      api.get('/transactions/all'),
    ]).then(([usersRes, loansRes, itemsRes, txRes]) => {
      setUsers(usersRes.data)
      setLoans(loansRes.data)
      setTransactions(txRes.data)
      setItems(itemsRes.data)
      const iMap: Record<number, string> = {}
      itemsRes.data.forEach((item: Item) => { iMap[item.id] = item.name })
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

  // --- Analytics computations ---
  const totalRevenue = transactions.reduce((s, t) => s + (t.total_price ?? 0), 0)
  const purchaseRevenue = transactions.filter(t => t.transaction_type === 'purchase').reduce((s, t) => s + (t.total_price ?? 0), 0)
  const rentalRevenue = transactions.filter(t => t.transaction_type === 'rental').reduce((s, t) => s + (t.total_price ?? 0), 0)

  const activeLoans = loans.filter(l => l.status === 'active')
  const returnedLoans = loans.filter(l => l.status === 'returned')
  const overdueLoans = activeLoans.filter(l => l.due_date && new Date(l.due_date) < new Date())

  const loanCountByItem = loans.reduce((acc, l) => {
    acc[l.item_id] = (acc[l.item_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  const topBorrowed = Object.entries(loanCountByItem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  const maxBorrowCount = topBorrowed[0]?.[1] ?? 1

  const revenueByItem = transactions.reduce((acc, t) => {
    acc[t.item_id] = (acc[t.item_id] || 0) + (t.total_price ?? 0)
    return acc
  }, {} as Record<number, number>)
  const topRevenue = Object.entries(revenueByItem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  const maxItemRevenue = topRevenue[0]?.[1] ?? 1

  // User stats
  const roleCount = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length
    return acc
  }, {} as Record<string, number>)
  const activeUsers = users.filter(u => u.is_active).length
  const maxRoleCount = Math.max(...Object.values(roleCount), 1)

  // Item stats
  const itemTypeCount = ['loanable', 'rentable', 'purchasable'].reduce((acc, t) => {
    acc[t] = items.filter(i => i.item_type === t).length
    return acc
  }, {} as Record<string, number>)
  const totalStock = items.reduce((s, i) => s + i.quantity, 0)
  const totalAvailable = items.reduce((s, i) => s + i.available, 0)
  const maxTypeCount = Math.max(...Object.values(itemTypeCount), 1)

  // Most active users
  const userActivity = users.map(u => ({
    ...u,
    loanCount: loans.filter(l => l.user_id === u.id).length,
    txCount: transactions.filter(t => t.user_id === u.id).length,
  }))
    .map(u => ({ ...u, total: u.loanCount + u.txCount }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxActivity = userActivity[0]?.total ?? 1

  const tabClass = (t: Tab) =>
    `px-4 py-2 rounded font-medium text-sm transition ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
            Users ({users.length})
          </button>
          <button onClick={() => setActiveTab('loans')} className={tabClass('loans')}>
            Loans ({loans.length})
          </button>
          <button onClick={() => setActiveTab('analytics')} className={tabClass('analytics')}>
            Analytics
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
                            type="number" min="0" step="0.01"
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
                    <td className="px-4 py-3 text-gray-500">{new Date(loan.loaned_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-500">{loan.returned_at ? new Date(loan.returned_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {/* Revenue cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{transactions.length} transactions</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">From Purchases</p>
                <p className="text-2xl font-bold text-gray-800">${purchaseRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{transactions.filter(t => t.transaction_type === 'purchase').length} purchases</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">From Rentals</p>
                <p className="text-2xl font-bold text-purple-600">${rentalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{transactions.filter(t => t.transaction_type === 'rental').length} rentals</p>
              </div>
            </div>

            {/* User stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-800 mb-1">Users by Role</h3>
                <p className="text-xs text-gray-400 mb-4">{users.length} total · {activeUsers} active · {users.length - activeUsers} inactive</p>
                <div className="space-y-3">
                  {ROLES.map(role => (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{role}</span>
                        <span className="text-gray-500">{roleCount[role] ?? 0}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${ROLE_COLORS[role]}`}
                          style={{ width: `${((roleCount[role] ?? 0) / maxRoleCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-800 mb-1">Items by Type</h3>
                <p className="text-xs text-gray-400 mb-4">{items.length} items · {totalAvailable}/{totalStock} units available</p>
                <div className="space-y-3">
                  {['loanable', 'rentable', 'purchasable'].map(type => (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{type}</span>
                        <span className="text-gray-500">{itemTypeCount[type] ?? 0}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${TYPE_COLORS[type]}`}
                          style={{ width: `${((itemTypeCount[type] ?? 0) / maxTypeCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loan status */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Loan Status Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{activeLoans.length}</p>
                  <p className="text-sm text-gray-500 mt-1">Active</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-500">{returnedLoans.length}</p>
                  <p className="text-sm text-gray-500 mt-1">Returned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{overdueLoans.length}</p>
                  <p className="text-sm text-gray-500 mt-1">Overdue</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Top borrowed items */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Most Borrowed / Rented</h3>
                {topBorrowed.length === 0 ? (
                  <p className="text-sm text-gray-400">No loan data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topBorrowed.map(([itemId, count]) => (
                      <div key={itemId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 truncate">{itemMap[Number(itemId)] || `Item #${itemId}`}</span>
                          <span className="text-gray-500 ml-2 shrink-0">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${(count / maxBorrowCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top revenue items */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Top Items by Revenue</h3>
                {topRevenue.length === 0 ? (
                  <p className="text-sm text-gray-400">No transaction data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topRevenue.map(([itemId, revenue]) => (
                      <div key={itemId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 truncate">{itemMap[Number(itemId)] || `Item #${itemId}`}</span>
                          <span className="text-green-600 ml-2 shrink-0">${revenue.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${(revenue / maxItemRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Most active users */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Most Active Users</h3>
              {userActivity.filter(u => u.total > 0).length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {userActivity.filter(u => u.total > 0).map(u => (
                    <div key={u.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{u.username}</span>
                          <span className="text-xs text-gray-400 capitalize">{u.role}</span>
                        </div>
                        <div className="flex gap-3 text-gray-500 shrink-0 ml-2">
                          <span>{u.loanCount} loans</span>
                          <span>{u.txCount} purchases</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-orange-400 rounded-full"
                          style={{ width: `${(u.total / maxActivity) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.slice(0, 15).map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{userMap[tx.user_id] || `#${tx.user_id}`}</td>
                      <td className="px-4 py-3">{itemMap[tx.item_id] || `#${tx.item_id}`}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                          tx.transaction_type === 'purchase' ? 'bg-green-100 text-green-700' :
                          tx.transaction_type === 'rental' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-green-700 font-medium">
                        ${tx.total_price?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
