import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

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
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/items/')
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load items'))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Inventory Manager</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-500 transition"
        >
          Log Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-lg font-semibold mb-4">Available Items</h2>

        {error && <p className="text-red-500">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                  {item.item_type}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 mb-2">{item.description}</p>
              )}
              <div className="text-sm text-gray-600">
                <p>Available: <span className="font-medium">{item.available}</span> / {item.quantity}</p>
                {item.department && <p>Dept: {item.department}</p>}
                {item.price && <p>Price: ${item.price}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
