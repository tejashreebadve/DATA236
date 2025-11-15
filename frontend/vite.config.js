import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/api/traveler': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/api/owner': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/api/property': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/api/booking': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})

