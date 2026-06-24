// Factory CRUD against catalog-ms /factories.
// Factory shape: { id, name }. The http client attaches the JWT and throws
// ApiError on non-2xx. /factories is open to any authenticated role (no extra
// restriction in the backend's SecurityConfig).
import { http } from './http'

// Paginated. `page` is 1-based (page=1 is the first page) to match the API.
// Resolves to a PagedResponse:
//   { content: Factory[], page, size, totalElements, totalPages, first, last }
export function listFactories(page = 1, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return http.get(`/factories?${params.toString()}`)
}

export function getFactory(id) {
  return http.get(`/factories/${id}`)
}

// Create: server assigns the id, so send the fields only.
export function createFactory({ name }) {
  return http.post('/factories', { name })
}

// Update: PUT replaces the factory; send the full body including id.
export function updateFactory(id, { name }) {
  return http.put(`/factories/${id}`, { id, name })
}

export function deleteFactory(id) {
  return http.delete(`/factories/${id}`)
}
