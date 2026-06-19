import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authContext'

// Guards nested routes. Unauthenticated users are bounced to /login (remembering
// where they were headed); authenticated-but-wrong-role users get /forbidden.
// Use as a layout route: <Route element={<ProtectedRoute roles={['ROLE_ADMIN']} />}>...
export function ProtectedRoute({ roles }) {
  const { isAuthenticated, hasRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles?.length && !roles.some((role) => hasRole(role))) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
