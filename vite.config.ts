import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/

// PR-6: same-origin dev proxy.
// In production the frontend and backend are typically reverse-proxied
// to the same origin (e.g. nginx serving React static files and proxying
// /api and /ws to the Django/Daphne process). In development we use
// Vite's built-in proxy so cookies set by the backend on /api/... are
// accepted by the browser (cookies are sent only on same-origin or
// explicitly-allowed cross-origin requests) and the WebSocket upgrade
// is forwarded with the Cookie header attached.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // REST API: forward /api/... to Django.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket: forward /ws/... to Daphne. `ws: true` upgrades the
      // connection; the Cookie header travels with the upgrade request,
      // so the backend reads ws_access from the same path as the HTTP
      // session.
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
