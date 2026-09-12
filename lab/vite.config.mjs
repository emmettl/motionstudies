import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react()],
  server: { proxy: { '/api/airports/': { target: process.env.MOTION_AIRPORT_WORKER_URL ?? 'https://motionstudies.app', changeOrigin: true, headers: { Origin: 'https://motionstudies.app' } } } },
  build: { target: 'es2022' },
})
