// Thin fetch wrapper for the catalog-ms backend.
//
// - Prefixes requests with the API base (empty in dev so Vite's proxy handles it;
//   set VITE_API_BASE_URL for builds that hit the backend directly).
// - Attaches the stored JWT as `Authorization: Bearer <token>`.
// - Parses JSON and turns non-2xx responses into a thrown `ApiError` carrying the
//   backend's { status, error, message } shape.

import { getToken } from './tokenStorage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(message, { status, error, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.error = error
    this.body = body
  }
}

async function request(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { ...headers }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'

  if (auth) {
    const token = getToken()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    // Network error / backend down — no HTTP response at all.
    throw new ApiError('Cannot reach the server. Is the backend running?', { status: 0, body: cause })
  }

  const data = await parseBody(response)

  if (!response.ok) {
    // Backend errors are { status, error, message }; fall back gracefully otherwise.
    const message = data?.message || data?.error || `Request failed (${response.status})`
    throw new ApiError(message, { status: response.status, error: data?.error, body: data })
  }

  return data
}

async function parseBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
