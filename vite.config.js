import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["plausible-hasty-scone.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: "http://localhost:8000",
        changeOrigin: true
      },
      '/uploads': {
        target: "http://localhost:8000",
        changeOrigin: true
      },
      '/socket.io': {
        target: "http://localhost:8000",
        ws: true
      }
    }
  }
})
