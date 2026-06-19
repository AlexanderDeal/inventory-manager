import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../api/client'

interface AuthContextType {
  token: string | null
  role: string | null
  login: (token: string) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [role, setRole] = useState<string | null>(null)

  // Fetch the current user's role whenever the token changes
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setRole(res.data.role))
        .catch(() => {
          // Token is invalid or expired — log out
          localStorage.removeItem('token')
          setToken(null)
          setRole(null)
        })
    } else {
      setRole(null)
    }
  }, [token])

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
