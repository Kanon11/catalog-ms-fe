// Reads the available roles (ADMIN-only). Role shape: { id, name }.
// The `name` is what user create/update payloads reference.
import { http } from './http'

export function listRoles() {
  return http.get('/roles')
}
