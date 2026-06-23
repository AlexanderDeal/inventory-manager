import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface Item {
  id: number
  name: string
  price: number | null
  image_url: string | null
}

interface Props {
  item: Item
  onClose: () => void
  onRented: (itemId: number) => void
}

const DURATIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
]

export default function RentModal({ item, onClose, onRented }: Props) {
  const { balance, refreshBalance } = useAuth()
  const { showToast } = useToast()
  const [days, setDays] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const dailyRate = item.price || 0
  const totalCost = dailyRate * days
  const canAfford = balance >= totalCost

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + days)

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/loans/', {
        item_id: item.id,
        due_date: dueDate.toISOString(),
      })
      refreshBalance()
      showToast(`${item.name} rented — due ${dueDate.toLocaleDateString()}`)
      onRented(item.id)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to rent item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Rent Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {item.image_url && (
          <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-4" />
        )}
        <p className="text-gray-600 mb-1">
          Renting <span className="font-semibold">{item.name}</span>
        </p>
        <p className="text-sm text-gray-400 mb-4">
          ${dailyRate.toFixed(2)} / day
        </p>

        <p className="text-sm font-medium text-gray-700 mb-2">Rental duration</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {DURATIONS.map(d => (
            <button
              key={d.days}
              onClick={() => setDays(d.days)}
              className={`px-3 py-1.5 rounded border text-sm transition ${days === d.days ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Daily rate</span>
            <span>${dailyRate.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span>{days} {days === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
            <span>Total</span>
            <span>${totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-gray-400">Due back</span>
            <span className="text-gray-500">{dueDate.toLocaleDateString()}</span>
          </div>
          <div className={`flex justify-between pt-1 border-t border-gray-200 ${canAfford ? 'text-green-700' : 'text-red-600'}`}>
            <span>Your balance</span>
            <span>${balance.toFixed(2)}</span>
          </div>
        </div>

        {!canAfford && (
          <p className="text-red-500 text-sm mb-3">Insufficient balance. Use "Add Funds" to top up.</p>
        )}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !canAfford}
            className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'Renting...' : `Rent for $${totalCost.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
