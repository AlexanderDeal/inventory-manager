import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Props {
  onClose: () => void
}

const QUICK_AMOUNTS = [10, 25, 50, 100]

export default function AddFundsModal({ onClose }: Props) {
  const { balance, refreshBalance } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/users/me/topup', { amount: parsed })
      refreshBalance()
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add funds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold mb-1">Add Funds</h2>
        <p className="text-sm text-gray-500 mb-4">
          Current balance: <span className="font-medium text-gray-800">${balance.toFixed(2)}</span>
        </p>

        {success ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium mb-4">Funds added successfully!</p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-3 flex-wrap">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded border text-sm transition ${amount === String(a) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  ${a}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="500"
              step="0.01"
              placeholder="Or enter custom amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm hover:bg-blue-800 transition disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Funds'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
