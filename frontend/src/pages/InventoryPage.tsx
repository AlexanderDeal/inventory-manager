import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import CreateItemModal from '../components/CreateItemModal'
import EditItemModal from '../components/EditItemModal'
import PurchaseModal from '../components/PurchaseModal'
import RentModal from '../components/RentModal'
import BorrowModal from '../components/BorrowModal'
import { SkeletonItemCard } from '../components/Skeleton'

interface Item {
  id: number
  name: string
  description: string | null
  item_type: string
  quantity: number
  available: number
  department: string | null
  price: number | null
  image_url: string | null
}

const TYPE_OPTIONS = [
  { value: 'purchasable', label: 'Buy',    dot: 'bg-green-500'  },
  { value: 'rentable',    label: 'Rent',   dot: 'bg-purple-500' },
  { value: 'loanable',    label: 'Borrow', dot: 'bg-blue-500'   },
]

const SORT_OPTIONS = [
  { value: 'name-asc',   label: 'Name (A–Z)'       },
  { value: 'name-desc',  label: 'Name (Z–A)'       },
  { value: 'price-asc',  label: 'Price (Low–High)' },
  { value: 'price-desc', label: 'Price (High–Low)' },
  { value: 'avail-desc', label: 'Most Available'   },
]

export default function InventoryPage() {
  const { role, refreshBalance } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [purchasingItem, setPurchasingItem] = useState<Item | null>(null)
  const [rentingItem, setRentingItem] = useState<Item | null>(null)
  const [borrowingItem, setBorrowingItem] = useState<Item | null>(null)

  // Filter & sort state
  const [search, setSearch] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(['purchasable', 'rentable', 'loanable']))
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')
  const [showFilters, setShowFilters] = useState(false)

  const isManager = role === 'manager' || role === 'admin'

  useEffect(() => {
    api.get('/items/')
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoading(false))
  }, [])

  function toggleType(type: string) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function clearFilters() {
    setSearch('')
    setActiveTypes(new Set(['purchasable', 'rentable', 'loanable']))
    setInStockOnly(false)
    setSortBy('name-asc')
  }

  const filteredItems = items
    .filter(i => activeTypes.has(i.item_type))
    .filter(i => !inStockOnly || i.available > 0)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':   return a.name.localeCompare(b.name)
        case 'name-desc':  return b.name.localeCompare(a.name)
        case 'price-asc':  return (a.price ?? 0) - (b.price ?? 0)
        case 'price-desc': return (b.price ?? 0) - (a.price ?? 0)
        case 'avail-desc': return b.available - a.available
        default:           return 0
      }
    })

  const isFiltered = search || activeTypes.size < 3 || inStockOnly || sortBy !== 'name-asc'
  const activeFilterCount = (search ? 1 : 0) + (3 - activeTypes.size) + (inStockOnly ? 1 : 0) + (sortBy !== 'name-asc' ? 1 : 0)

  async function handleDelete(itemId: number) {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await api.delete(`/items/${itemId}`)
      setItems(items.filter(i => i.id !== itemId))
    } catch {
      setError('Failed to delete item')
    }
  }

  function handleUpdated(updated: Item) {
    setItems(items.map(i => i.id === updated.id ? updated : i))
  }

  const filterPanel = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">Filters</h3>
        {isFiltered && (
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
            Clear
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Type</p>
      <div className="space-y-2 mb-4">
        {TYPE_OPTIONS.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeTypes.has(opt.value)}
              onChange={() => toggleType(opt.value)}
              className="rounded"
            />
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Availability</p>
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={e => setInStockOnly(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-700">In stock only</span>
      </label>

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sort By</p>
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading...' : `${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'} available`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              className="sm:hidden flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              onClick={() => setShowFilters(f => !f)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
              >
                + Add Item
              </button>
            )}
          </div>
        </div>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="sm:hidden mb-4">
            {filterPanel}
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* Desktop filter sidebar */}
          <div className="hidden sm:block w-52 shrink-0 sticky top-6">
            {filterPanel}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonItemCard key={i} />)}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 font-medium">No items match your filters</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter options</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow overflow-hidden">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-36 object-cover" />
                    )}
                    <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded capitalize shrink-0 ml-2 ${
                          item.item_type === 'purchasable' ? 'bg-green-100 text-green-700' :
                          item.item_type === 'rentable' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.item_type}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                      )}
                      <div className="text-sm text-gray-600 mb-4">
                        <p>Available: <span className="font-medium">{item.available}</span> / {item.quantity}</p>
                        {item.department && <p>Dept: {item.department}</p>}
                        {item.item_type === 'rentable' && item.price && <p className="text-purple-600 font-medium">${item.price}/day</p>}
                        {item.item_type === 'purchasable' && item.price && <p className="text-green-600 font-medium">${item.price}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {item.item_type === 'purchasable' ? (
                        <button
                          onClick={() => setPurchasingItem(item)}
                          disabled={item.available === 0}
                          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {item.available === 0 ? 'Out of Stock' : 'Buy'}
                        </button>
                      ) : item.item_type === 'rentable' ? (
                        <button
                          onClick={() => setRentingItem(item)}
                          disabled={item.available === 0}
                          className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {item.available === 0 ? 'Unavailable' : 'Rent'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setBorrowingItem(item)}
                          disabled={item.available === 0}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {item.available === 0 ? 'Unavailable' : 'Borrow'}
                        </button>
                      )}
                      {isManager && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition"
                          >
                            Edit
                          </button>
                          {role === 'admin' && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="flex-1 border border-red-300 text-red-500 py-1.5 rounded-lg text-sm hover:bg-red-50 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateItemModal
          onClose={() => setShowCreateModal(false)}
          onCreated={item => setItems([...items, item])}
        />
      )}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={handleUpdated}
        />
      )}
      {purchasingItem && (
        <PurchaseModal
          item={purchasingItem}
          onClose={() => setPurchasingItem(null)}
          onPurchased={(itemId, quantity) => {
            setItems(items.map(i => i.id === itemId ? { ...i, available: i.available - quantity } : i))
            refreshBalance()
          }}
        />
      )}
      {rentingItem && (
        <RentModal
          item={rentingItem}
          onClose={() => setRentingItem(null)}
          onRented={itemId =>
            setItems(items.map(i => i.id === itemId ? { ...i, available: i.available - 1 } : i))
          }
        />
      )}
      {borrowingItem && (
        <BorrowModal
          item={borrowingItem}
          onClose={() => setBorrowingItem(null)}
          onBorrowed={itemId =>
            setItems(items.map(i => i.id === itemId ? { ...i, available: i.available - 1 } : i))
          }
        />
      )}
    </div>
  )
}
