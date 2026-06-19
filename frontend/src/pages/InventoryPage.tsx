import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import CreateItemModal from '../components/CreateItemModal'

interface Item {
  id: number
  name: string
  description: string | null
  item_type: string
  quantity: number
  available: number
  department: string | null
  price: number | null
}

export default function InventoryPage() {
  const { logout, role } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [borrowing, setBorrowing] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    api.get('/items/')
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load items'))
  }, [])

  async function handleBorrow(itemId: number) {
    setBorrowing(itemId)
    try {
      await api.post('/loans/', { item_id: itemId, due_date: null })
      // Update available count locally so user sees it immediately
      setItems(items.map(i => i.id === itemId ? { ...i, available: i.available - 1 } : i))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to borrow item')
    } finally {
      setBorrowing(null)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Inventory Manager</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/loans')}
            className="text-sm text-blue-600 hover:underline"
          >
            My Loans
          </button>
          {role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-purple-600 hover:underline"
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-red-500 transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Available Items</h2>
          {(role === 'manager' || role === 'admin') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              + Add Item
            </button>
          )}
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                    {item.item_type}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                )}
                <div className="text-sm text-gray-600 mb-4">
                  <p>Available: <span className="font-medium">{item.available}</span> / {item.quantity}</p>
                  {item.department && <p>Dept: {item.department}</p>}
                  {item.price && <p>Price: ${item.price}</p>}
                </div>
              </div>

              {item.item_type !== 'purchasable' && (
                <button
                  onClick={() => handleBorrow(item.id)}
                  disabled={item.available === 0 || borrowing === item.id}
                  className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {borrowing === item.id ? 'Borrowing...' : item.available === 0 ? 'Unavailable' : 'Borrow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <CreateItemModal
          onClose={() => setShowCreateModal(false)}
          onCreated={item => setItems([...items, item])}
        />
      )}
    </div>
  )
}
