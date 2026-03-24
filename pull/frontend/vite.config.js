import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/info': 'http://localhost:5100',
      '/check-file': 'http://localhost:5100',
      '/download': 'http://localhost:5100',
      '/history': 'http://localhost:5100',
      '/proxy-thumb': 'http://localhost:5100',
    },
  },
})
