import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setApiToken } from '../api/axios'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setLoading] = useState(true)

  function setToken(value) {
    setTokenState(value)
    setApiToken(value)
  }

  const logout = useCallback(() => {
    api.post('auth/logout').catch(() => {})
    setTokenState(null)
    setApiToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

    fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error('NO_SESSION')
        }
        return res.json()
      })
      .then(async data => {
        setTokenState(data.accessToken)
        setApiToken(data.accessToken)

        const meRes = await fetch(`${baseUrl}/users/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { Authorization: `Bearer ${data.accessToken}` }
        })

        if (!meRes.ok) {
          throw new Error('ME_FAILED')
        }

        const me = await meRes.json()
        setUser(me)
      })
      .catch(() => {
        setTokenState(null)
        setApiToken(null)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })

    const handleLogout = () => {
      sessionStorage.setItem('sessionExpiredMessage', 'Сессия завершена, войдите заново')
      setTokenState(null)
      setApiToken(null)
      setUser(null)
    }

    window.addEventListener('authlogout', handleLogout)
    return () => window.removeEventListener('authlogout', handleLogout)
  }, [])

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}