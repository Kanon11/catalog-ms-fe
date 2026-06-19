// User CRUD against catalog-ms /users (ADMIN-only on the backend).
//
// Shapes (from the API):
//   UserResponse      { id, username, enabled, roles: string[] }
//   CreateUserRequest { username, password, roles: string[] }
//   UpdateUserRequest { password?, enabled, roles: string[] }   // omit password to keep current
import { http } from './http'

export function listUsers() {
  return http.get('/users')
}

export function createUser({ username, password, roles }) {
  return http.post('/users', { username, password, roles })
}

// Only include `password` when the admin actually typed a new one.
export function updateUser(id, { password, enabled, roles }) {
  const body = { enabled, roles }
  if (password) body.password = password
  return http.put(`/users/${id}`, body)
}

export function deleteUser(id) {
  return http.delete(`/users/${id}`)
}
