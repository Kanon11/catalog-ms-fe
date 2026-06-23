import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Dev proxy: forward the backend's REST paths to catalog-ms (Spring Boot on :7171)
// so the browser talks to Vite same-origin and we avoid CORS during development.
// Override the target with VITE_API_TARGET when the backend runs elsewhere.
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:7171'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': { target: API_TARGET, changeOrigin: true },
      '/products': { target: API_TARGET, changeOrigin: true },
      '/books': { target: API_TARGET, changeOrigin: true },
      '/users': { target: API_TARGET, changeOrigin: true },
      '/roles': { target: API_TARGET, changeOrigin: true },
      '/settings': { target: API_TARGET, changeOrigin: true },
      '/health': { target: API_TARGET, changeOrigin: true },
    },
  },
})
