import { useRef, useState } from 'react'
import api from '../api/client'

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

interface Props {
  item: Item
  onClose: () => void
  onUpdated: (item: Item) => void
}

export default function EditItemModal({ item, onClose, onUpdated }: Props) {
  const [form, setForm] = useState({
    name: item.name,
    description: item.description || '',
    quantity: item.quantity,
    available: item.available,
    department: item.department || '',
    price: item.price?.toString() || '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(item.image_url)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/items/${item.id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImagePreview(res.data.image_url)
      onUpdated(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage() {
    setUploading(true)
    setError('')
    try {
      const res = await api.delete(`/items/${item.id}/image`)
      setImagePreview(null)
      onUpdated(res.data)
    } catch {
      setError('Failed to remove image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        quantity: Number(form.quantity),
        available: Number(form.available),
        department: form.department || null,
        price: form.price ? Number(form.price) : null,
      }
      const res = await api.patch(`/items/${item.id}`, payload)
      onUpdated(res.data)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Image section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt={item.name}
                className="w-full h-40 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-white/90 text-gray-700 text-xs px-2.5 py-1 rounded-lg shadow hover:bg-white transition"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="bg-white/90 text-red-600 text-xs px-2.5 py-1 rounded-lg shadow hover:bg-white transition"
                >
                  Remove
                </button>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{uploading ? 'Uploading...' : 'Click to upload photo'}</span>
              <span className="text-xs">JPEG, PNG, WebP — max 2MB</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Quantity</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Available</label>
              <input
                type="number"
                name="available"
                value={form.available}
                onChange={handleChange}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {(item.item_type === 'purchasable' || item.item_type === 'rentable') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {item.item_type === 'rentable' ? 'Daily Rate ($/day)' : 'Price ($)'}
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min={0}
                step={0.01}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm hover:bg-blue-800 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
