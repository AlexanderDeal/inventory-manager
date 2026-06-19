import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Item {
  id: number
  name: string
  price: number | null
  available: number
}

interface Props {
  item: Item
  onClose: () => void
  onPurchased: (itemId: number, quantity: number) => void
}

export default function PurchaseModal({ item, onClose, onPurchased }: Props) {
  const { balance } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalNum = (item.price || 0) * quantity
  const total = totalNum.toFixed(2)
  const canAfford = balance >= totalNum

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/transactions/', { item_id: item.id, quantity })
      onPurchased(item.id, quantity)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Purchase failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Confirm Purchase</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <p className="text-gray-600 mb-4">You are purchasing <span className="font-semibold">{item.name}</span>.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            max={item.available}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-gray-50 rounded p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Price per item</span>
            <span>${item.price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
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

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || quantity < 1 || quantity > item.available || !canAfford}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}
