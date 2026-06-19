# catalog-ms-fe

Admin frontend for the **catalog-ms** backend. A React single-page app for signing in
and managing products, users, roles, and application settings, with JWT auth and
role-based access control.

Built with React 19, Vite, React Router 7, and Ant Design 6.

## Features

- **JWT login** against `POST /auth/login`; the session (token + user) is persisted in
  `localStorage`, so a reload keeps you signed in.
- **Role-based routing.** Routes are guarded by [`ProtectedRoute`](src/routes/ProtectedRoute.jsx):
  unauthenticated users are sent to `/login`, authenticated-but-wrong-role users to
  `/forbidden`.
- **Role-filtered navigation.** The sidebar in [`Layout`](src/components/Layout.jsx) only
  shows the pages the current user's roles allow (configured in [`config/menu.js`](src/config/menu.js)).
- **CRUD pages:**
  - **Products** — paginated list, create/edit/delete (`ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_SUPERVISOR`).
  - **Users** — create/edit/delete, enable/disable, role assignment (`ROLE_ADMIN`).
  - **Roles** — view available roles (`ROLE_ADMIN`).
  - **Settings** — flat key/value application settings (`ROLE_ADMIN`).
- **Theming** — brand purple with automatic OS light/dark mode ([`Root.jsx`](src/Root.jsx)).

> Note: route/menu role checks are a UX convenience. The backend enforces the same
> rules — the frontend is not a security boundary.

## Requirements

- Node.js 20+ (developed on Node 24)
- The **catalog-ms** backend running (default `http://localhost:7171`)

## Getting started

```bash
npm install
npm run dev
```

The app starts on Vite's dev server (default http://localhost:5173). During development,
Vite proxies the backend's REST paths (`/auth`, `/products`, `/users`, `/roles`,
`/settings`, `/health`) to the backend so the browser stays same-origin and avoids CORS
(see [`vite.config.js`](vite.config.js)).

## Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR + proxy.  |
| `npm run build`   | Production build to `dist/`.                 |
| `npm run preview` | Serve the production build locally.          |
| `npm run lint`    | Run ESLint over the project.                 |

## Configuration

Configured via Vite env vars (e.g. an `.env` / `.env.local` file or the shell):

| Variable             | Used by | Default                 | Purpose                                                                 |
| -------------------- | ------- | ----------------------- | ----------------------------------------------------------------------- |
| `VITE_API_TARGET`    | dev     | `http://localhost:7171` | Backend the dev-server proxy forwards to.                               |
| `VITE_API_BASE_URL`  | build   | `''` (empty)            | Base URL the app prefixes onto API requests. Leave empty in dev so the proxy handles it; set it for builds that call the backend directly. |

## Project structure

```
src/
  main.jsx              App entry; mounts <Root>.
  Root.jsx              Global providers: antd theme/App, router, auth.
  App.jsx               Route table (public, protected, admin-only).
  auth/
    AuthProvider.jsx    Session state, seeded from localStorage.
    authContext.js      useAuth() context.
  routes/
    ProtectedRoute.jsx  Auth + role route guard.
  components/
    Layout.jsx          Authenticated app shell (sidebar + header).
  config/
    menu.js             Sidebar items and the roles allowed to see each.
  pages/                LoginPage, ProductsPage, UsersPage, RolesPage,
                        SettingsPage, ForbiddenPage.
  services/
    http.js             fetch wrapper: base URL, JWT header, ApiError on non-2xx.
    tokenStorage.js     JWT + user persistence in localStorage.
    authService.js      /auth/login + client-side session helpers.
    productService.js   /products CRUD (paginated).
    userService.js      /users CRUD.
    roleService.js      /roles (read).
    settingService.js   /settings (read + merge update).
```

## Backend API

All requests go through [`services/http.js`](src/services/http.js), which prefixes the
base URL, attaches `Authorization: Bearer <token>`, and converts non-2xx responses into a
thrown `ApiError` carrying the backend's `{ status, error, message }` shape.

| Endpoint            | Method            | Roles                                   |
| ------------------- | ----------------- | --------------------------------------- |
| `/auth/login`       | POST              | public                                  |
| `/products`         | GET (paginated, 1-based), POST | ADMIN / MANAGER / SUPERVISOR |
| `/products/{id}`    | GET, PUT, DELETE  | ADMIN / MANAGER / SUPERVISOR            |
| `/users`            | GET, POST         | ADMIN                                   |
| `/users/{id}`       | PUT, DELETE       | ADMIN                                   |
| `/roles`            | GET               | ADMIN                                   |
| `/settings`         | GET, PUT (merge)  | ADMIN                                   |

## Building for production

```bash
npm run build      # outputs to dist/
npm run preview    # smoke-test the build
```

For a build that talks to a real backend, set `VITE_API_BASE_URL` to the backend origin
(the dev proxy does not exist in production) and serve `dist/` from any static host.
