import { createContext, useContext } from 'react'

// Auth context value: { user, isAuthenticated, login, logout, hasRole }.
// Kept separate from AuthProvider so the provider file only exports a component
// (keeps Vite fast-refresh happy).
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
