// Worker CRUD against catalog-ms /workers.
// Worker shape: { workerId, nid, workerName, mobileNo, factoryId }. factoryId
// references a Factory (/factories) and may be null. The http client attaches
// the JWT and throws ApiError on non-2xx. /workers is open to any authenticated
// role (no extra restriction in the backend's SecurityConfig).
import { http } from './http'

// Paginated. `page` is 1-based (page=1 is the first page) to match the API.
// Resolves to a PagedResponse:
//   { content: Worker[], page, size, totalElements, totalPages, first, last }
export function listWorkers(page = 1, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return http.get(`/workers?${params.toString()}`)
}

export function getWorker(id) {
  return http.get(`/workers/${id}`)
}

// Create: server assigns the workerId, so send the fields only.
export function createWorker({ nid, workerName, mobileNo, factoryId }) {
  return http.post('/workers', { nid, workerName, mobileNo, factoryId })
}

// Update: PUT replaces the worker; send the full body including workerId.
export function updateWorker(id, { nid, workerName, mobileNo, factoryId }) {
  return http.put(`/workers/${id}`, { workerId: id, nid, workerName, mobileNo, factoryId })
}

export function deleteWorker(id) {
  return http.delete(`/workers/${id}`)
}
