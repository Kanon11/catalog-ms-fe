// Application CRUD against catalog-ms /applications.
// Application shape: { applicationId, workerId, applicationDate, reasonForUnemployment, status }.
// applicationDate is an ISO date string ("yyyy-MM-dd"); status is PENDING/APPROVED/REJECTED.
// The http client attaches the JWT and throws ApiError on non-2xx. /applications is
// open to any authenticated role (no extra restriction in the backend's SecurityConfig).
import { http } from './http'

// Paginated. `page` is 1-based (page=1 is the first page) to match the API.
// Pass `workerId` to list only that worker's applications.
// Resolves to a PagedResponse:
//   { content: Application[], page, size, totalElements, totalPages, first, last }
export function listApplications(page = 1, size = 10, workerId) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (workerId != null) params.set('workerId', String(workerId))
  return http.get(`/applications?${params.toString()}`)
}

export function getApplication(id) {
  return http.get(`/applications/${id}`)
}

// Create: server assigns the applicationId, and defaults applicationDate to today
// and status to PENDING when omitted, so send the fields only.
export function createApplication({ workerId, applicationDate, reasonForUnemployment, status }) {
  return http.post('/applications', { workerId, applicationDate, reasonForUnemployment, status })
}

// Update: PUT replaces the application; send the full body including applicationId.
export function updateApplication(id, { workerId, applicationDate, reasonForUnemployment, status }) {
  return http.put(`/applications/${id}`, {
    applicationId: id,
    workerId,
    applicationDate,
    reasonForUnemployment,
    status,
  })
}

export function deleteApplication(id) {
  return http.delete(`/applications/${id}`)
}
