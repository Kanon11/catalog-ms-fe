import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
// import { ProductsPage } from './pages/ProductsPage'
// import { BooksPage } from './pages/BooksPage'
import { WorkersPage } from './pages/WorkersPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { FactoriesPage } from './pages/FactoriesPage'
import { UsersPage } from './pages/UsersPage'
import { RolesPage } from './pages/RolesPage'
import { SettingsPage } from './pages/SettingsPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Layout } from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Authenticated area: shared nav layout. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/workers" replace />} />
          {/* <Route path="/products" element={<ProductsPage />} /> */}
          {/* <Route path="/books" element={<BooksPage />} /> */}
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/factories" element={<FactoriesPage />} />

          {/* Admin-only menu pages. */}
          <Route element={<ProtectedRoute roles={['ROLE_ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
