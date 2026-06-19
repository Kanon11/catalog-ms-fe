import { useCallback, useMemo, useState } from 'react'
import {
  login as loginRequest,
  logout as logoutRequest,
  getCurrentUser,
} from '../services/authService'
import { AuthContext } from './authContext'

// Holds the session in React state, seeded from localStorage so a reload keeps the
// user logged in. Exposes login/logout that keep both state and storage in sync.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())

  const login = useCallback(async (username, password) => {
    const data = await loginRequest(username, password)
    const session = { username: data.username, roles: data.roles ?? [] }
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setUser(null)
  }, [])

  const hasRole = useCallback((role) => user?.roles?.includes(role) ?? false, [user])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout, hasRole }),
    [user, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
