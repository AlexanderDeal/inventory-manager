import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../api/client'

interface AuthContextType {
  token: string | null
  role: string | null
  username: string | null
  balance: number
  refreshBalance: () => void
  login: (token: string) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [role, setRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)

  function fetchMe() {
    api.get('/auth/me')
      .then(res => {
        setRole(res.data.role)
        setUsername(res.data.username)
        setBalance(res.data.balance ?? 0)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setRole(null)
        setUsername(null)
        setBalance(0)
      })
  }

  useEffect(() => {
    if (token) {
      fetchMe()
    } else {
      setRole(null)
      setUsername(null)
      setBalance(0)
    }
  }, [token])

  function refreshBalance() {
    if (token) fetchMe()
  }

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setRole(null)
    setUsername(null)
    setBalance(0)
  }

  return (
    <AuthContext.Provider value={{ token, role, username, balance, refreshBalance, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
