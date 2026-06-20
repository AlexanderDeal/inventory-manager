import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import AddFundsModal from '../components/AddFundsModal'

interface Loan {
  id: number
  item_id: number
  status: string
  loaned_at: string
  due_date: string | null
  returned_at: string | null
}

interface Transaction {
  id: number
  item_id: number
  quantity: number
  total_price: number | null
  created_at: string
}

export default function HomePage() {
  const { username, role, balance } = useAuth()
  const navigate = useNavigate()

  const [loans, setLoans] = useState<Loan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [itemMap, setItemMap] = useState<Record<number, string>>({})
  const [userCount, setUserCount] = useState<number | null>(null)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calls = [
      api.get('/loans/'),
      api.get('/transactions/mine'),
      api.get('/items/'),
    ]
    Promise.all(calls).then(([loansRes, txRes, itemsRes]) => {
      setLoans(loansRes.data)
      setTransactions(txRes.data)
      const map: Record<number, string> = {}
      itemsRes.data.forEach((i: { id: number; name: string }) => { map[i.id] = i.name })
      setItemMap(map)
      setLoading(false)
    })

    if (role === 'admin') {
      api.get('/users/').then(res => setUserCount(res.data.length))
    }
  }, [role])

  const activeLoans = loans.filter(l => l.status === 'active')
  const overdueLoans = activeLoans.filter(l => l.due_date && new Date(l.due_date) < new Date())
  const recentLoans = [...loans].sort((a, b) => new Date(b.loaned_at).getTime() - new Date(a.loaned_at).getTime()).slice(0, 4)
  const recentTx = [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)

  const roleLabel: Record<string, string> = {
    student: 'Student',
    staff: 'Staff',
    manager: 'Manager',
    admin: 'Admin',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Welcome banner */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {username}!</h2>
            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize font-medium">
              {roleLabel[role ?? ''] ?? role}
            </span>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Browse Inventory
          </button>
        </div>

        {/* Overdue alert */}
        {overdueLoans.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-700">
                You have {overdueLoans.length} overdue {overdueLoans.length === 1 ? 'loan' : 'loans'}
              </p>
              <p className="text-sm text-red-500 mt-0.5">Please return overdue items as soon as possible.</p>
            </div>
            <button
              onClick={() => navigate('/loans')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition"
            >
              View Loans
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className={`grid gap-4 ${role === 'admin' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Balance</p>
            <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
            <button
              onClick={() => setShowAddFunds(true)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Add Funds
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Active Loans</p>
            <p className="text-2xl font-bold text-blue-600">{activeLoans.length}</p>
            {overdueLoans.length > 0 && (
              <p className="mt-1 text-xs text-red-500">{overdueLoans.length} overdue</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-purple-600">{transactions.length}</p>
          </div>

          {role === 'admin' && userCount !== null && (
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-700">{userCount}</p>
              <button
                onClick={() => navigate('/admin')}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Manage Users
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/inventory')}
              className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Browse Inventory
            </button>
            <button
              onClick={() => navigate('/loans')}
              className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Activity
            </button>
            <button
              onClick={() => setShowAddFunds(true)}
              className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Funds
            </button>
            {role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-50 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Recent loans */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Loans</h3>
              <button onClick={() => navigate('/loans')} className="text-xs text-blue-600 hover:underline">
                View all
              </button>
            </div>
            {recentLoans.length === 0 ? (
              <p className="text-sm text-gray-400">No loans yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLoans.map(loan => {
                  const overdue = loan.status === 'active' && loan.due_date && new Date(loan.due_date) < new Date()
                  return (
                    <div key={loan.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {itemMap[loan.item_id] || `Item #${loan.item_id}`}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(loan.loaned_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ml-2 shrink-0 ${
                        overdue ? 'bg-red-100 text-red-700' :
                        loan.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {overdue ? 'Overdue' : loan.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent purchases */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Purchases</h3>
              <button onClick={() => navigate('/loans')} className="text-xs text-blue-600 hover:underline">
                View all
              </button>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-sm text-gray-400">No purchases yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {itemMap[tx.item_id] || `Item #${tx.item_id}`}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-medium text-green-700 ml-2 shrink-0">
                      ${tx.total_price?.toFixed(2) ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} />}
    </div>
  )
}
