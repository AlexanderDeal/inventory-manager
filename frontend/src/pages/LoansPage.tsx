import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import { useToast } from '../context/ToastContext'
import { SkeletonLoanCard, SkeletonRow } from '../components/Skeleton'

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
  const { showToast } = useToast()
  const [loans, setLoans] = useState<Loan[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [itemMap, setItemMap] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
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
      .finally(() => setLoading(false))
  }, [])

  async function handleReturn(loanId: number) {
    try {
      await api.patch(`/loans/${loanId}/return`)
      const itemName = itemMap[loans.find(l => l.id === loanId)?.item_id ?? 0]
      showToast(itemName ? `${itemName} returned` : 'Item returned')
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your loans, borrows, and purchases</p>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2.5 font-medium text-sm rounded-t-lg transition border-b-2 -mb-px ${
              activeTab === 'loans'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Loans ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2.5 font-medium text-sm rounded-t-lg transition border-b-2 -mb-px ${
              activeTab === 'purchases'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Purchases ({transactions.length})
          </button>
        </div>

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Active Loans ({activeLoans.length})</h2>
            {loading ? (
              <div className="space-y-3 mb-8">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonLoanCard key={i} />)}
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-12 text-center mb-8">
                <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 font-medium">No active loans</p>
                <p className="text-sm text-gray-400 mt-1">Items you borrow or rent will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {activeLoans.map(loan => {
                  const overdue = isOverdue(loan)
                  return (
                  <div key={loan.id} className={`rounded-xl shadow-sm p-4 flex justify-between items-center ${overdue ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100'}`}>
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-10 text-center">
                <p className="text-gray-400 text-sm">No past loans yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastLoans.map(loan => (
                  <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 opacity-60">
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
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 divide-y divide-gray-100">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-12 text-center">
                <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 font-medium">No purchases yet</p>
                <p className="text-sm text-gray-400 mt-1">Items you buy will appear here</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
