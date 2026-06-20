import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'

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

interface Item {
  id: number
  name: string
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [itemMap, setItemMap] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'loans' | 'purchases'>('loans')

  useEffect(() => {
    Promise.all([
      api.get('/loans/'),
      api.get('/transactions/mine'),
      api.get('/items/'),
    ])
      .then(([loansRes, txRes, itemsRes]) => {
        setLoans(loansRes.data)
        setTransactions(txRes.data)
        const map: Record<number, string> = {}
        itemsRes.data.forEach((item: Item) => { map[item.id] = item.name })
        setItemMap(map)
      })
      .catch(() => setError('Failed to load data'))
  }, [])

  async function handleReturn(loanId: number) {
    try {
      await api.patch(`/loans/${loanId}/return`)
      setLoans(loans.map(l =>
        l.id === loanId ? { ...l, status: 'returned', returned_at: new Date().toISOString() } : l
      ))
    } catch {
      setError('Failed to return item')
    }
  }

  const activeLoans = loans.filter(l => l.status === 'active')
  const pastLoans = loans.filter(l => l.status !== 'active')

  function isOverdue(loan: Loan) {
    return !!loan.due_date && new Date(loan.due_date) < new Date()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded font-medium text-sm ${activeTab === 'loans' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            My Loans ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded font-medium text-sm ${activeTab === 'purchases' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            My Purchases ({transactions.length})
          </button>
        </div>

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Active Loans ({activeLoans.length})</h2>
            {activeLoans.length === 0 ? (
              <p className="text-gray-500 mb-8">No active loans.</p>
            ) : (
              <div className="space-y-3 mb-8">
                {activeLoans.map(loan => {
                  const overdue = isOverdue(loan)
                  return (
                  <div key={loan.id} className={`rounded-lg shadow p-4 flex justify-between items-center ${overdue ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium">{itemMap[loan.item_id] || `Item #${loan.item_id}`}</p>
                        {overdue && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Borrowed: {new Date(loan.loaned_at).toLocaleDateString()}
                      </p>
                      {loan.due_date && (
                        <p className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-orange-500'}`}>
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
                  )
                })}
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
          </>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Purchase History</h2>
            {transactions.length === 0 ? (
              <p className="text-gray-500">No purchases yet.</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Quantity</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Total Paid</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{itemMap[tx.item_id] || `Item #${tx.item_id}`}</td>
                        <td className="px-4 py-3">{tx.quantity}</td>
                        <td className="px-4 py-3">${tx.total_price?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
