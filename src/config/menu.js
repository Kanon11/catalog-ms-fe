// Sidebar navigation. Each item lists the roles allowed to see it; the Layout
// filters this against the current user's roles. Backend enforces the same rules.
export const MENU = [
  // { label: 'Product list', path: '/products', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPERVISOR'] },
  // { label: 'Book list', path: '/books', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPERVISOR'] },
  { label: 'Worker list', path: '/workers', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPERVISOR'] },
  { label: 'Application list', path: '/applications', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPERVISOR'] },
  { label: 'Factory list', path: '/factories', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPERVISOR'] },
  { label: 'Users', path: '/users', roles: ['ROLE_ADMIN'] },
  { label: 'Roles', path: '/roles', roles: ['ROLE_ADMIN'] },
  { label: 'Settings', path: '/settings', roles: ['ROLE_ADMIN'] },
]
