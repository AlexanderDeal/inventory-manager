import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AddFundsModal from './AddFundsModal'
import ChangePasswordModal from './ChangePasswordModal'

export default function Navbar() {
  const { username, role, email, department, balance, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initial = username?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <nav className="bg-blue-900 px-6 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M16 7V25" stroke="white" strokeWidth="1.5"/>
              <path d="M9 11L23 11" stroke="white" strokeWidth="1.5"/>
              <path d="M9 11L16 15L23 11" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Inventory Manager
            </h1>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className={`text-sm transition pb-0.5 border-b-2 ${
              pathname === '/inventory'
                ? 'text-white border-white'
                : 'text-blue-200 hover:text-white border-transparent'
            }`}
          >
            Inventory
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 hover:bg-blue-800 rounded-lg px-3 py-1.5 transition"
          >
            <div className="w-8 h-8 bg-white text-blue-900 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {initial}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">{username}</p>
              <p className="text-xs text-blue-300 capitalize leading-tight">{role}</p>
            </div>
            <svg
              className={`w-4 h-4 text-blue-300 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-68 bg-white rounded-xl shadow-lg border border-gray-100 z-50 min-w-[260px]">

              {/* Profile header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{username}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{role}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate">{email}</p>
                {department && <p className="text-xs text-gray-400 mt-0.5">{department}</p>}
              </div>

              {/* Balance */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Balance</p>
                    <p className="text-xl font-bold text-gray-900">${balance.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => { setShowAddFunds(true); setOpen(false) }}
                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Funds
                  </button>
                </div>
              </div>

              {/* Nav links */}
              <div className="py-1">
                <button
                  onClick={() => { navigate('/loans'); setOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My Activity
                </button>

                {role === 'admin' && (
                  <button
                    onClick={() => { navigate('/admin'); setOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-3 transition"
                  >
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => { setShowChangePassword(true); setOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} />}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </>
  )
}
