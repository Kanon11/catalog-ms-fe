// Application settings (ADMIN-only). It's a flat string->string map.
// Note: PUT merges the supplied keys into the existing map (it cannot delete keys).
import { http } from './http'

export function getSettings() {
  return http.get('/settings')
}

export function updateSettings(map) {
  return http.put('/settings', map)
}
