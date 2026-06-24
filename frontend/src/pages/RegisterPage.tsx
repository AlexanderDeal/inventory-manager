import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useAuth()

  useEffect(() => {
    if (isLoggedIn) navigate('/')
  }, [isLoggedIn])

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
  })
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/register', form)
      const loginRes = await api.post('/auth/login', { email: form.email, password: form.password })
      login(loginRes.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Inventory Manager</h1>
          <p className="text-gray-500 mt-2 text-sm">Create your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input name="username" value={form.username} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="you@university.edu" pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="department" value={form.department} onChange={handleChange} className={inputClass} />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
            >
              Create Account
            </button>
          </form>
          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
