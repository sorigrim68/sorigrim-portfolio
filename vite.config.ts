import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  build:
    process.env.VITE_BUILD_BOARD === 'true'
      ? { rollupOptions: { input: resolve(__dirname, 'board-index.html') } }
      : undefined,
  plugins: [react()],
})
