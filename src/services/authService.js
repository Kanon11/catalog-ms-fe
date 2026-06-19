// Auth service for the login page.
//
// Wraps the catalog-ms /auth/login endpoint and owns the client-side session.
// The login page should call `login()` and react to the returned session or a
// thrown ApiError (401 -> "Invalid credentials").

import { http } from './http'
import { clearSession, getToken, getUser, setToken, setUser } from './tokenStorage'

/**
 * Authenticate against POST /auth/login.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, username: string, roles: string[] }>}
 * @throws {ApiError} 401 on bad credentials, status 0 if the backend is unreachable.
 */
export async function login(username, password) {
  // auth:false — we don't have a token yet, and don't want a stale one attached.
  const data = await http.post('/auth/login', { username, password }, { auth: false })

  setToken(data.token)
  setUser({ username: data.username, roles: data.roles ?? [] })
  return data
}

/** Clears the stored token + user. Backend is stateless, so logout is client-side only. */
export function logout() {
  clearSession()
}

/** True if a token is currently stored (does not validate expiry server-side). */
export function isAuthenticated() {
  return Boolean(getToken())
}

/** The logged-in user { username, roles } or null. */
export function getCurrentUser() {
  return getUser()
}

/** Convenience role check, e.g. hasRole('ROLE_ADMIN'). */
export function hasRole(role) {
  return getUser()?.roles?.includes(role) ?? false
}
