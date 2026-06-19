import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Loan {
  id: number
  item_id: number
  status: string
  loaned_at: string
  due_date: string | null
  returned_at: string | null
}

interface Item {
  id: number
  name: string
}

export default function LoansPage() {
  const { logout, role } = useAuth()
  const navigate = useNavigate()
  const [loans, setLoans] = useState<Loan[]>([])
  const [itemMap, setItemMap] = useState<Record<number, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/loans/'), api.get('/items/')])
      .then(([loansRes, itemsRes]) => {
        setLoans(loansRes.data)
        const map: Record<number, string> = {}
        itemsRes.data.forEach((item: Item) => { map[item.id] = item.name })
        setItemMap(map)
      })
      .catch(() => setError('Failed to load data'))
  }, [])

  async function handleReturn(loanId: number) {
    try {
      await api.patch(`/loans/${loanId}/return`)
      setLoans(loans.map(l => l.id === loanId ? { ...l, status: 'returned', returned_at: new Date().toISOString() } : l))
    } catch {
      setError('Failed to return item')
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const activeLoans = loans.filter(l => l.status === 'active')
  const pastLoans = loans.filter(l => l.status !== 'active')

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Inventory Manager</h1>
          <button onClick={() => navigate('/inventory')} className="text-sm text-blue-600 hover:underline">
            Inventory
          </button>
          {role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="text-sm text-purple-600 hover:underline">
              Admin Dashboard
            </button>
          )}
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-500">
          Log Out
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <h2 className="text-lg font-semibold mb-4">Active Loans ({activeLoans.length})</h2>
        {activeLoans.length === 0 ? (
          <p className="text-gray-500 mb-8">No active loans.</p>
        ) : (
          <div className="space-y-3 mb-8">
            {activeLoans.map(loan => (
              <div key={loan.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{itemMap[loan.item_id] || `Item #${loan.item_id}`}</p>
                  <p className="text-sm text-gray-500">
                    Borrowed: {new Date(loan.loaned_at).toLocaleDateString()}
                  </p>
                  {loan.due_date && (
                    <p className="text-sm text-orange-500">
                      Due: {new Date(loan.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleReturn(loan.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm transition"
                >
                  Return
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold mb-4">Past Loans ({pastLoans.length})</h2>
        {pastLoans.length === 0 ? (
          <p className="text-gray-500">No past loans.</p>
        ) : (
          <div className="space-y-3">
            {pastLoans.map(loan => (
              <div key={loan.id} className="bg-white rounded-lg shadow p-4 opacity-60">
                <p className="font-medium">{itemMap[loan.item_id] || `Item #${loan.item_id}`}</p>
                <p className="text-sm text-gray-500">
                  Borrowed: {new Date(loan.loaned_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Returned: {loan.returned_at ? new Date(loan.returned_at).toLocaleDateString() : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
